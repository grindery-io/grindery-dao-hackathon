/*global chrome*/
import Web3 from 'web3';
import _ from 'lodash';
import moment from 'moment';
import Decimal from 'decimal.js';

import {FIAT_CURRENCIES, INTEGRATIONS, MESSAGE_TYPES, MODELS, SPREADSHEET_COLUMNS} from './contants';
import {
  deduplicateContacts,
  columnToLetter,
  paymentParser,
  paymentIdentifier,
  convertCurrency,
  deduplicatePayments
} from './utils';
import {readFromStorage, STORAGE_KEYS, writeToStorage} from './storage';
import {getAuthToken, getSpreadsheetData, updateSpreadsheetData} from './google';
import {ERROR_MESSAGES, GrinderyError} from './errors';
import {createProvider, createWeb3} from './metamask';

export const getWeb3Instance = () => {
  try {
    const provider = createProvider();
    if (provider) {
      return createWeb3(provider);
    }
  } catch (e) {
    //console.error('provider or web3 error => ', e);
  }
  return null;
};

export const sendExtensionMessage = data => {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(data || {}, res => {
        if(chrome.runtime.lastError) {
          //console.error('sendExtensionMessage chrome.runtime.lastError => ', chrome.runtime.lastError.message || chrome.runtime.lastError);
          reject(chrome.runtime.lastError.message || chrome.runtime.lastError);
        } else if(res && res.data) {
          resolve(res && res.data || null);
        } else {
          //console.error('chrome sendMessage error => ', res && res.error);
          reject(res && res.error || null);
        }
      });
    } catch (e) {
      //console.error('chrome sendMessage error => ', e);
      reject(e);
    }
  });
};

export const makeBackgroundRequest = (task, payload=null) => {
  return sendExtensionMessage({
    type: MESSAGE_TYPES.TASK,
    task,
    payload,
  });
};

export const sendExtensionNotification = (event, payload=null) => {
  return sendExtensionMessage({
    type: MESSAGE_TYPES.NOTIFICATION,
    event,
    payload,
  });
};

export const sendExtensionEvent = (event, payload=null) => {
  return sendExtensionMessage({
    type: MESSAGE_TYPES.EVENT,
    event,
    payload,
  });
};

export const sendContentRequest = (action, payload=null) => {
  const data = {
    type: MESSAGE_TYPES.ACTION,
    action,
    payload,
  };
  return new Promise((resolve, reject) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const tabId = tabs && tabs[0] && tabs[0].id || null;
      if(tabId) {
        chrome.tabs.sendMessage(tabId, data, (res) => {
          if(res && res.data) {
            resolve(res && res.data || null);
          } else {
            reject(res && res.error || null);
          }
        });
      } else {
        reject(new Error('Failed to get current tab'));
      }
    });
  });
};

export const sendMetaRequest = (action, tabId, payload=null) => {
  const data = {
    type: MESSAGE_TYPES.ACTION,
    action,
    payload,
  };
  return new Promise((resolve, reject) => {
    if(tabId) {
      chrome.tabs.sendMessage(tabId, data, (res) => {
        if(res && res.data) {
          resolve(res && res.data || null);
        } else {
          reject(res && res.error || null);
        }
      });
    } else {
      reject(new Error('No tab specified'));
    }
  });
};

export const listenForExtensionNotification = (events, callback) => {
  //return; // TODO: @david Remove this
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(chrome.runtime.lastError) {
      return;
    }

    if(message && message.type === MESSAGE_TYPES.NOTIFICATION && (Array.isArray(events) && events.includes(message.event) || message.event === events)) {
      callback(message.event, message.payload);
      sendResponse({message: 'received'});
    }
  });
};

export const listenForExtensionEvent = (events, callback) => {
  //return; // TODO: @david Remove this
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if(chrome.runtime.lastError) {
      //console.error('listenForExtensionEvent chrome.runtime.lastError => ', chrome.runtime.lastError.message || chrome.runtime.lastError);
      return;
    }

    if(message && message.type === MESSAGE_TYPES.EVENT && (Array.isArray(events) && events.includes(message.event) || message.event === events)) {
      callback(message.event, message.payload);
      sendResponse({message: 'received'});
    }
  });
};

export const parseFromGoogleSheet = (model, columnMap, data) => {
  let items = [];
  const spreadsheetColumns = data[0];

  let modelColumns = [],
    modelValidator = item => Object.keys(item).length;

  switch (model) {
    case MODELS.CONTACTS: {
      modelColumns = [
        SPREADSHEET_COLUMNS.NAME, SPREADSHEET_COLUMNS.EMAIL, SPREADSHEET_COLUMNS.ADDRESS
      ];
      modelValidator = item => Object.keys(item).length && Web3.utils.isAddress(item.address);
      break;
    }
    case MODELS.PAYMENT_REQUESTS: {
      modelColumns = [
        SPREADSHEET_COLUMNS.RECIPIENT, SPREADSHEET_COLUMNS.CURRENCY, SPREADSHEET_COLUMNS.AMOUNT,
        SPREADSHEET_COLUMNS.DUE_DATE, SPREADSHEET_COLUMNS.DETAILS
      ];
      break;
    }
    default: {
      break;
    }
  }

  for (const item of (data || []).slice(1)) {
    let parsedItem = {};

    for (const key of modelColumns) {
      const spreadsheetColumnName = key && columnMap[key],
        spreadsheetColumnIdx = spreadsheetColumns.indexOf(spreadsheetColumnName);
      if (spreadsheetColumnIdx > -1) {
        parsedItem[key] = item[spreadsheetColumnIdx];
      }
    }

    if (typeof modelValidator === 'function' && modelValidator(parsedItem)) {
      items.push(parsedItem);
    }
  }

  return items;
};

export const formatGoogleSheetInput = (model, sheetTitle, columnMap, columns, data) => {
  let input = [],
    keyMap = {};

  let cleanedColumns = [...(columns || [])];
  for (const key of Object.keys(columnMap)) {
    const columnName = columnMap[key];
    if(!(columns || []).includes(columnName)) {
      cleanedColumns.push(columnName);
    }
  }

  let modelColumns = [];
  switch (model) {
    case MODELS.CONTACTS: {
      modelColumns = [
        SPREADSHEET_COLUMNS.NAME, SPREADSHEET_COLUMNS.EMAIL, SPREADSHEET_COLUMNS.ADDRESS
      ];
      break;
    }
    case MODELS.PAYMENT_REQUESTS: {
      modelColumns = [
        SPREADSHEET_COLUMNS.RECIPIENT, SPREADSHEET_COLUMNS.CURRENCY, SPREADSHEET_COLUMNS.AMOUNT,
        SPREADSHEET_COLUMNS.DUE_DATE, SPREADSHEET_COLUMNS.DETAILS
      ];
      break;
    }
    default: {
      break;
    }
  }

  if(data && Array.isArray(data)) {
    for (const key of Object.keys(columnMap)) {
      keyMap[columnMap[key]] = key;
    }

    for (const [idx, item] of (data || []).entries()) {
      if(item) {
        let columnIndices = [],
          rowValues = [];

        const cleanValue = (item, key) => (item && (item[key] || typeof item[key] === 'number'))?item[key]:'';

        for (const columnName of Object.keys(keyMap)) {
          const key = keyMap[columnName];
          const columnIdx = (cleanedColumns || []).indexOf(columnName);
          if(modelColumns.includes(key)) {
            columnIndices.push(columnIdx);
            rowValues.push(cleanValue(item, key));
          }
        }

        if(rowValues.length && columnIndices.length === rowValues.length) {
          let groups = [],
            currentGroup = {row: idx, values: []};

          for (const [itemIdx, value] of rowValues.entries()) {
            const columnIdx = columnIndices[itemIdx];
            if(typeof currentGroup.start !== 'number') {
              currentGroup.start = columnIdx;
              currentGroup.end = columnIdx;
            } else if(typeof currentGroup.end === 'number' && (columnIdx - currentGroup.end) === 1) {
              currentGroup.end = columnIdx;
            } else {
              groups.push(currentGroup);
              currentGroup = {row: idx, values: [], start: columnIdx, end: columnIdx};
            }
            currentGroup.values.push(value);
            if(itemIdx === (rowValues.length - 1)) {
              groups.push(currentGroup);
            }
          }

          for (const group of groups) {
            input.push({
              range: `${sheetTitle}!${_.uniq([group.start, group.end]).map(i => `${columnToLetter(i+1)}${group.row+2}`).join(':')}`,
              values: [group.values],
            });
          }
        }
      }
    }
  }
  return input;
};

export const mergeWithGoogleSheets = async () => {
  const integrations = await readFromStorage(STORAGE_KEYS.INTEGRATIONS);
  if(integrations && integrations[INTEGRATIONS.GOOGLE_SHEETS]) {
    const spreadsheet = integrations[INTEGRATIONS.GOOGLE_SHEETS],
      spreadsheetId = spreadsheet.id,
      contactsSheetTitle = (spreadsheet.contacts && spreadsheet.contacts.sheet && spreadsheet.contacts.sheet.title) || (spreadsheet.sheet && spreadsheet.sheet.title),
      contactsColumnMap = (spreadsheet.contacts && spreadsheet.contacts.columnMap) || spreadsheet.columnMap,
      paymentsSheetTitle = spreadsheet.paymentRequests && spreadsheet.paymentRequests.sheet && spreadsheet.paymentRequests.sheet.title,
      paymentsColumnMap = spreadsheet.paymentRequests && spreadsheet.paymentRequests.columnMap;

    if(spreadsheetId && (
      (contactsSheetTitle && contactsColumnMap) ||
      (paymentsSheetTitle && paymentsColumnMap)
    )) {
      const token = await getAuthToken().catch(() => {});
      if(token) {
        let contacts = [],
          payments = [];

        // Merge contacts
        const contactsData = await getSpreadsheetData(token, spreadsheetId, contactsSheetTitle).catch(() => {});
        if(contactsData && Array.isArray(contactsData)) {
          const sheetContacts = parseFromGoogleSheet(MODELS.CONTACTS, contactsColumnMap, contactsData);
          const contactsRes = await readFromStorage(STORAGE_KEYS.CONTACTS).catch(() => {});
          const localContacts = contactsRes && Array.isArray(contactsRes)?contactsRes:[];
          contacts = deduplicateContacts([...localContacts, ...sheetContacts]);
        }

        // Merge payments
        const paymentsData = await getSpreadsheetData(token, spreadsheetId, paymentsSheetTitle).catch(() => {});
        if(paymentsData && Array.isArray(paymentsData)) {
          const sheetPayments = parseFromGoogleSheet(MODELS.PAYMENT_REQUESTS, paymentsColumnMap, paymentsData);
          const paymentsRes = await readFromStorage(STORAGE_KEYS.PAYMENTS).catch(() => {});
          const localPayments = paymentsRes && Array.isArray(paymentsRes)?paymentsRes:[];

          payments = [...localPayments];
          const existingPaymentIds = payments.map(i => paymentIdentifier(i, true));
          for (const item of sheetPayments.filter(i => !existingPaymentIds.includes(paymentIdentifier(i, true)))) {
            const payment = paymentParser(item);
            if(payment && payment.address && payment.currency && payment.amount) {
              const isUSD = payment.currency === FIAT_CURRENCIES.USD;
              let fiatAmount = 0;
              if(!isUSD) {
                fiatAmount = await convertCurrency(payment.amount, payment.currency, FIAT_CURRENCIES.USD, 2);
              }
              payments.push({
                address: payment.address,
                inputCurrency: payment.currency,
                ...(isUSD?{
                  amount: new Decimal(payment.amount).toFixed(2),
                }:{
                  value: new Decimal(payment.amount).toFixed(4),
                  amount: fiatAmount,
                }),
                ...(payment.due_date?{
                  due_date: moment.utc(`${payment.due_date} ${payment.due_time}`, 'YYYY-MM-DD HH:mm:ss').format()
                }:{}),
                details: payment.details || '',
              });
            }
          }

          payments = deduplicatePayments(payments);
        }

        if((contacts && contacts.length) || (payments && payments.length)) {
          return {
            spreadsheet,
            token,
            ...((contacts && contacts.length && contactsSheetTitle && contactsColumnMap)?{
              contacts: {
                data: contacts,
                input: formatGoogleSheetInput(
                  MODELS.CONTACTS, contactsSheetTitle, contactsColumnMap,
                  contactsData && contactsData[0] || [], contacts
                )
              }
            }:{}),
            ...((payments && payments.length && contactsSheetTitle && contactsColumnMap)?{
              payments: {
                data: payments,
                input: formatGoogleSheetInput(
                  MODELS.PAYMENT_REQUESTS, paymentsSheetTitle, paymentsColumnMap,
                  paymentsData && paymentsData[0] || [], payments.map(i => {
                    const payment = paymentParser(i);
                    return {
                      ...payment,
                      recipient: payment.address,
                      due_date: moment.utc(payment.due_date).format('DD/MMM/YYYY'),
                    };
                  })
                )
              }
            }:{}),
          };
        }

        throw new GrinderyError(ERROR_MESSAGES.GOOGLE_SHEETS_READ_FAILED);
      } else {
        throw new GrinderyError(ERROR_MESSAGES.GOOGLE_CONNECT_FAILED);
      }

    } else {
      throw new GrinderyError(ERROR_MESSAGES.GOOGLE_SHEETS_NO_INTEGRATION);
    }
  } else {
    throw new GrinderyError(ERROR_MESSAGES.GOOGLE_SHEETS_NO_INTEGRATION);
  }

};

export const syncWithGoogleSheets = async () => {
  return mergeWithGoogleSheets().then(res => {
    const {spreadsheet, token, contacts, payments} = res || {};
    let promiseArray = [];

    for (const [storageKey, source] of [
      [STORAGE_KEYS.CONTACTS, contacts],
      [STORAGE_KEYS.PAYMENTS, payments],
    ]) {
      // Sync contacts and payment requests
      const {data, input} = source || {};
      if(data && Array.isArray(data)) {
        promiseArray.push(
          writeToStorage(storageKey, data).then(() => {
            if(spreadsheet && spreadsheet.id && input && Array.isArray(input) && input.length) {
              if(token) {
                updateSpreadsheetData(token, spreadsheet.id, {
                  valueInputOption: 'USER_ENTERED',
                  data: input,
                }).catch(() => {});
              }
            }
            return data;
          }).catch(e => {
            throw new GrinderyError(e, ERROR_MESSAGES.SAVE_FAILED);
          })
        );
      }
    }

    if(promiseArray.length) {
      return Promise.all(promiseArray);
    }
    throw new GrinderyError(ERROR_MESSAGES.GOOGLE_SHEETS_MERGE_FAILED);
  }).catch(e => {
    throw new GrinderyError(e)
  });
};