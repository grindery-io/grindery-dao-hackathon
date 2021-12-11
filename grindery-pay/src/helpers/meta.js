import axios from 'axios';
import {GRINDERY_INDEX_URL} from './contants';
import {savePaymentRequests} from './storage';

const parseMetaPaymentRequest = data => {
  if(data.recipient && data.recipient.address && data.currency && data.amount) {
    let payment = {
      address: data.recipient.address,
    };
    payment.inputCurrency = data.currency;
    payment.amount = data.amount;
    if(data.dueDate) {
      payment.due_date =  data.dueDate;
    }
    if(data.note) {
      payment.details = data.note;
    }
    if(data.recipient.name) {
      payment.name = data.recipient.name;
    }
    return payment;
  }
  return null;
};

export const getPaymentRequests = account => {
  return axios.get(`${GRINDERY_INDEX_URL}/payment-request?account=${encodeURIComponent(account)}`).then(res => {
    const items = res && res.data && res.data.items;
    if(items && Array.isArray(items) && items.length) {
      let payments = [];
      for (const item of items) {
        const {cid, data} = item;
        const payment = parseMetaPaymentRequest(data);
        if(payment) {
          payments.push(payment);
        }
      }
      return payments;
    }
    return [];
  });
};

export const syncPaymentRequests = account => {
  getPaymentRequests(account).then(payments => {
    if(payments && Array.isArray(payments) && payments.length) {
      savePaymentRequests(payments).catch(() => {});
    }
  }).catch(() => {});
};

export const getBatchPaymentInfo = id => {
  return axios.get(`${GRINDERY_INDEX_URL}/batch-payment?id=${encodeURIComponent(id)}`).then(res => {
    const items = res && res.data && res.data.items;
    if(items && Array.isArray(items) && items.length) {
      for (const item of items) {
        const {cid, data} = item;
        const {payments, paymentMethod, paymentMethodInfo, creator } = data || item;
        let recipients = [];
        if(payments && Array.isArray(payments) && payments.length) {
          for (const i of payments) {
            if(i.recipient && i.recipient.address && i.currency && i.value) {
              recipients.push({
                address: i.recipient.address,
                name: i.recipient.name || '',
                amount: i.value,
                ...(i.paymentCurrency?{
                  currency: i.paymentCurrency,
                }:{}),
                ...(i.note?{
                  note: i.note,
                }:{}),
              });
            }
          }
        }

        if(recipients.length) {
          return {
            ...((creator && (creator.address || creator.name))?{
              sender: {
                address: creator.address || '',
                name: creator.name || '',
              }
            }:{}),
            recipients,
          }
        }
      }
    }
    throw new Error('Failed to get batch info');
  });
};