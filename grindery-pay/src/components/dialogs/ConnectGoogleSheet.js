import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Button,
  CircularProgress,
  Input,
  InputAdornment,
  FormGroup,
  FormLabel,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import {Search as SearchIcon} from '@material-ui/icons';
import clsx from 'clsx';
import _ from 'lodash';

import Dialog, {useStyles as dialogStyles} from '../containers/Dialog';

import AppContext from '../../AppContext';

import {ACTIONS, INTEGRATIONS, SPREADSHEET_COLUMNS, SPREADSHEET_COLUMNS_DISPLAY} from '../../helpers/contants';
import {connectToGoogle, getSpreadsheets, getSpreadsheet, getSpreadsheetData} from '../../helpers/google';
import {sendContentRequest, syncWithGoogleSheets} from '../../helpers/routines';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {searchItems} from '../../helpers/utils';

const useStyles = makeStyles((theme) => ({
  alert: {
    margin: theme.spacing(0, 0, 2),
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(1.5),
  },
  formGroup: {
    marginBottom: theme.spacing(2),
  },
  searchOption: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#FFF',
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
  }
}));

const STEPS = {
  CONTACTS: 'contacts',
  PAYMENT_REQUESTS: 'payment_requests'
};

const SHEET_KEYS = {
  CONTACTS: 'contactsSheet',
  PAYMENT_REQUESTS: 'paymentRequestsSheet'
};

export default ({initialData, nextDialog}) => {
  const classes = useStyles();
  const dialogClasses = dialogStyles();
  const {openDialog, closeDialog, getContacts, getPayments, addIntegration} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(false);

  const [search, setSearch] = useState('');
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [spreadsheet, setSpreadsheet] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [sheets, setSheets] = useState([]);
  const [contactsSheetData, setContactsSheetData] = useState([]);
  const [paymentsSheetData, setPaymentsSheetData] = useState([]);

  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState(null);
  const [formError, setFormError] = useState(null);
  const [contactsColumnMap, setContactsColumnMap] = useState({});
  const [paymentsColumnMap, setPaymentsColumnMap] = useState({});
  const [contactsColumnMapErrors, setContactsColumnMapErrors] = useState(null);
  const [paymentsColumnMapErrors, setPaymentsColumnMapErrors] = useState(null);
  const [step, setStep] = useState(STEPS.CONTACTS);

  const isSpreadsheetSelected = data && data.spreadsheet,
    isPaymentRequestsStep = step === STEPS.PAYMENT_REQUESTS,
    isSheetSelected = data && (
      (isPaymentRequestsStep && (data[SHEET_KEYS.PAYMENT_REQUESTS] || typeof data[SHEET_KEYS.PAYMENT_REQUESTS] === 'number')) ||
      (!isPaymentRequestsStep && (data[SHEET_KEYS.CONTACTS] || typeof data[SHEET_KEYS.CONTACTS] === 'number'))
    ),
    stepSheetKey = isPaymentRequestsStep?SHEET_KEYS.PAYMENT_REQUESTS:SHEET_KEYS.CONTACTS;

  const updateData = (key, value) => {
    setData(data => ({...(data || {}), [key]: value || typeof value === 'number' ? value : ''}));
    if (errors && errors[key]) {
      let newErrors = {...(errors || {})};
      delete newErrors[key];
      setErrors(newErrors);
    }
  };

  const updateColumnMap = (key, value) => {
    const updatedMap = {
      ...((isPaymentRequestsStep?paymentsColumnMap:contactsColumnMap) || {}),
      [key]: value || typeof value === 'number' ? value : ''
    };
    if(isPaymentRequestsStep) {
      setPaymentsColumnMap(updatedMap);
    } else {
      setContactsColumnMap(updatedMap);
    }
    if (errors && errors[key]) {
      let newColumnMapErrors = {...(errors || {})};
      delete newColumnMapErrors[key];
      if(isPaymentRequestsStep) {
        setPaymentsColumnMapErrors(newColumnMapErrors);
      } else {
        setContactsColumnMapErrors(newColumnMapErrors);
      }
    }
  };

  const parseSpreadsheetOptions = () => {
    return (spreadsheets || []).map(item => {
      if(item) {
        const value = item.id,
          label = item.name || item.id || '';
        return {
          value,
          label,
        };
      }
      return null;
    }).filter(i => i);
  };

  const spreadsheetOptionsResults = searchItems(
    search, parseSpreadsheetOptions(spreadsheets), ['value', 'label'], ['label']
  );

  useEffect(() => {
    setLoading(true);
    setFormError(null);
    connectToGoogle(true).then(token => {
      if (token) {
        setToken(token);
        getSpreadsheets(token).then(res => {
          setLoading(false);
          if (res && Array.isArray(res)) {
            setSpreadsheets(res);

            sendContentRequest(ACTIONS.GET_ACTIVE_GOOGLE_SHEET_INFO).then(contentRes => {
              if(contentRes.id) {
                updateData('spreadsheet', contentRes.id);
              }
            }).catch(() => {});
          }
        }).catch(() => {
          setLoading(false);
          setFormError(ERROR_MESSAGES.GOOGLE_SHEETS_CONNECT_FAILED);
        });
      } else {
        setLoading(false);
        setFormError(ERROR_MESSAGES.GOOGLE_SHEETS_CONNECT_FAILED);
      }
    }).catch(() => {
      setLoading(false);
      setFormError(ERROR_MESSAGES.GOOGLE_SHEETS_CONNECT_FAILED);
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      let newData;
      if (initialData) {
        newData = {...(initialData || {})};
      } else {
        newData = {...(initialData || {})};
      }
      if (newData) {
        setData(newData);
      }
    }
  }, [initialData]);

  useEffect(() => {
    if (token && data.spreadsheet) {
      setLoading(true);

      const spreadsheetDetails = (spreadsheets || []).find(i => i.id === data.spreadsheet) || null;
      setData({
        ...(data || {}),
        spreadsheetName: spreadsheetDetails && spreadsheetDetails.name || '',
        [SHEET_KEYS.CONTACTS]: '',
        [SHEET_KEYS.PAYMENT_REQUESTS]: '',
      });
      getSpreadsheet(token, data.spreadsheet).then(res => {
        setLoading(false);
        if (res) {
          setSpreadsheet(res);
          if (res.sheets && Array.isArray(res.sheets)) {
            setSheets(res.sheets);
            let sheetId = res.sheets[0] && res.sheets[0].id;
            sendContentRequest(ACTIONS.GET_ACTIVE_GOOGLE_SHEET_INFO).then(contentRes => {
              if(contentRes.id === data.spreadsheet && contentRes.sheet && contentRes.sheet.title) {
                const selectedSheet = (res.sheets || []).find(i => i.title === contentRes.sheet.title);
                if(selectedSheet && selectedSheet.id) {
                  sheetId = selectedSheet.id;
                }
              }
              updateData(SHEET_KEYS.CONTACTS, sheetId);
            }).catch(() => {
              updateData(SHEET_KEYS.CONTACTS, sheetId);
            });
          }
        }
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [data.spreadsheet]);

  useEffect(() => {
    const sheetId = data && (isPaymentRequestsStep?data[SHEET_KEYS.PAYMENT_REQUESTS]:data[SHEET_KEYS.CONTACTS]);
    if (token && data && data.spreadsheet && (sheetId || typeof sheetId === 'number')) {
      const sheet = sheets.find(i => i.id === sheetId) || null;
      setLoading(true);
      getSpreadsheetData(token, data.spreadsheet, sheet && sheet.title || '').then(res => {
        setLoading(false);
        if (res && Array.isArray(res)) {
          if(isPaymentRequestsStep) {
            setPaymentsSheetData(res);
          } else {
            setContactsSheetData(res);
          }

          const columns = res[0] || [];
          if(columns && columns.length) {
            let defaultColumnMap = {};
            for (const [key, test] of isPaymentRequestsStep?[
              [SPREADSHEET_COLUMNS.RECIPIENT, i => /address|wallet|recipient/i.test(i) && !/e?-?mail/i.test(i)],
              [SPREADSHEET_COLUMNS.CURRENCY, i => /currency|token/i.test(i)],
              [SPREADSHEET_COLUMNS.AMOUNT, i => /amount|value/i.test(i)],
              [SPREADSHEET_COLUMNS.DUE_DATE, i => /due|date/i.test(i)],
              [SPREADSHEET_COLUMNS.AMOUNT, i => /amount/i.test(i)],
              [SPREADSHEET_COLUMNS.DETAILS, i => /details?|comments?|desc(ription)?/i.test(i)],
            ]:[
              [SPREADSHEET_COLUMNS.NAME, i => /name/i.test(i)],
              [SPREADSHEET_COLUMNS.EMAIL, i => /e?-?mail/i.test(i)],
              [SPREADSHEET_COLUMNS.ADDRESS, i => /address|wallet/i.test(i) && !/e?-?mail/i.test(i)]
            ]) {
              for (const column of columns) {
                const takenColumns = Object.keys(defaultColumnMap).map(i => defaultColumnMap[i]);
                if(test && typeof test === 'function' && test(column) && !takenColumns.includes(column)) {
                  defaultColumnMap[key] = column;
                }
              }
            }
            if(Object.keys(defaultColumnMap).length) {
              if(isPaymentRequestsStep) {
                setPaymentsColumnMap(defaultColumnMap);
              } else {
                setContactsColumnMap(defaultColumnMap);
              }
            }
          }
        }
      }).catch(e => {
        setLoading(false);
      });
    }
  }, [data[SHEET_KEYS.CONTACTS], data[SHEET_KEYS.PAYMENT_REQUESTS]]);

  const saveIntegration = e => {
    e.preventDefault();

    if(step !== STEPS.PAYMENT_REQUESTS) {
      const otherSheets = (sheets || []).filter(i => i.id !== data[SHEET_KEYS.CONTACTS]);
      setStep(STEPS.PAYMENT_REQUESTS);
      updateData(SHEET_KEYS.PAYMENT_REQUESTS, otherSheets && otherSheets[0] && otherSheets[0].id || null);
      return ;
    }

    const contactsSheetDetails = sheets.find(i => i.id === data[SHEET_KEYS.CONTACTS]) || null,
      paymentsSheetDetails = sheets.find(i => i.id === data[SHEET_KEYS.PAYMENT_REQUESTS]) || null;
    const contactsInfo = {
      sheet: {
        id: data[SHEET_KEYS.CONTACTS],
        ...(contactsSheetDetails || {}),
      },
      columnMap: contactsColumnMap,
      columns: contactsSheetData && contactsSheetData[0] || [],
    };
    const integration = {
      id: data.spreadsheet,
      ..._.omit(spreadsheet, ['sheets']),
      ...contactsInfo,
      contacts: {
        ...contactsInfo,
      },
      paymentRequests: {
        sheet: {
          id: data[SHEET_KEYS.PAYMENT_REQUESTS],
          ...(paymentsSheetDetails || {}),
        },
        columnMap: paymentsColumnMap,
        columns: paymentsSheetData && paymentsSheetData[0] || [],
      },
    };

    setSaving(true);
    addIntegration(INTEGRATIONS.GOOGLE_SHEETS, integration).then(() => {
      setSaving(false);
      syncWithGoogleSheets().then(() => {
        // Refresh contacts and payments
        getContacts().catch(() => {});
        getPayments().catch(() => {});
      }).catch(() => {});
      if (nextDialog) {
        openDialog({...nextDialog, integration});
      } else {
        closeDialog();
      }
    }).catch(e => {
      setSaving(false);
      setFormError(e && e.message || ERROR_MESSAGES.UNKNOWN);
    });
  };

  const columnMap = isPaymentRequestsStep?paymentsColumnMap:contactsColumnMap,
    columnMapErrors = isPaymentRequestsStep?paymentsColumnMapErrors:contactsColumnMapErrors,
    sheetData = isPaymentRequestsStep?paymentsSheetData:contactsSheetData,
    stepSheetId = (data && (data[stepSheetKey] || typeof data[stepSheetKey] === 'number'))?data[stepSheetKey]:'';

  return (
    <Dialog title="Connect Google Sheet"
            ariaLabel="connect google sheet">
      <form onSubmit={saveIntegration}>
        {formError && (
          <Alert severity="error" className={classes.alert}>{formError || ''}</Alert>
        ) || null}

        {loading && !(spreadsheets || []).length && (
          <div className={classes.loading}>
            <CircularProgress size={30}/>
          </div>
        ) || (
          <FormGroup className={classes.formGroup}>
            <TextField label="Spreadsheet"
                       type="text"
                       select
                       value={data && data.spreadsheet || ''}
                       placeholder="Spreadsheet"
                       required={true}
                       error={errors && errors.spreadsheet || ''}
                       helperText={errors && errors.spreadsheet || ''}
                       onChange={e => {
                         const value = e.target.value;
                         updateData('spreadsheet', value);
                       }}
                       disabled={isPaymentRequestsStep}
                       SelectProps={{
                         open: showOptions,
                         onOpen: (e) => {
                           setShowOptions(true);
                         },
                         onClose: (e) => {
                           const elem = e.target;
                           if(!elem || elem.getAttribute('type') !== 'search') {
                             setShowOptions(false);
                             setSearch('');
                           }
                         },
                         MenuProps: {
                           autoFocus: false,
                         }
                       }}>
              <MenuItem key="search">
                <Input type="search"
                       placeholder="Search"
                       autoFocus={true}
                       startAdornment={(
                         <InputAdornment position="start">
                           <SearchIcon/>
                         </InputAdornment>
                       )}
                       onKeyDown={e => {
                         e.stopPropagation();
                       }}
                       onChange={e => {
                         setSearch(e.target.value || '');
                       }}
                       className={classes.searchInput}/>
              </MenuItem>
              {(spreadsheetOptionsResults || []).map(item => {
                if (item) {
                  const value = item.value,
                    label = item.label || item.value || '';

                  return (
                    <MenuItem key={value}
                              value={value}>
                      {label}
                    </MenuItem>
                  );
                }
                return null;
              })}
            </TextField>
          </FormGroup>
        )}

        {(data && isSpreadsheetSelected) && (
          <>
            {loading && !(sheets || []).length && (
              <div className={classes.loading}>
                <CircularProgress size={30}/>
              </div>
            ) || (
              <div>
                {/*
                <Typography variant="h6" component="h2">
                  {isPaymentRequestsStep?'Payment Requests':'Contacts'}
                </Typography>
                */}

                <FormGroup className={classes.formGroup}>
                  {formError && (
                    <Alert severity="error" className={classes.alert}>{formError || ''}</Alert>
                  ) || null}

                  <TextField label={`${isPaymentRequestsStep?'Payment Requests':'Contacts'} Sheet`}
                             type="text"
                             select
                             value={stepSheetId}
                             placeholder="Sheet"
                             required={true}
                             error={errors && errors[stepSheetKey] || ''}
                             helperText={errors && errors[stepSheetKey] || ''}
                             onChange={e => updateData(stepSheetKey, e.target.value)}>
                    {(sheets || []).map(item => {
                      if (item) {
                        const value = item.id,
                          label = item.title || item.id || '';
                        return (
                          <MenuItem key={value}
                                    value={value}>
                            {label}
                          </MenuItem>
                        );
                      }
                      return null;
                    })}
                  </TextField>
                </FormGroup>
              </div>
            )}

            {isSheetSelected && (
              <>
                <FormLabel required={true}>
                  Column Map
                </FormLabel>

                {loading && !(sheetData || []).length && (
                  <div className={classes.loading}>
                    <CircularProgress size={30}/>
                  </div>
                ) || (
                  <>
                    {(
                      isPaymentRequestsStep?[
                        SPREADSHEET_COLUMNS.RECIPIENT,
                        SPREADSHEET_COLUMNS.CURRENCY,
                        SPREADSHEET_COLUMNS.AMOUNT,
                        SPREADSHEET_COLUMNS.DUE_DATE,
                        SPREADSHEET_COLUMNS.DETAILS,
                      ]:[
                        SPREADSHEET_COLUMNS.NAME,
                        SPREADSHEET_COLUMNS.EMAIL,
                        SPREADSHEET_COLUMNS.ADDRESS
                      ]
                    ).map(value => {
                      const label = SPREADSHEET_COLUMNS_DISPLAY[value] || value || '';
                      return (
                        <FormGroup className={classes.formGroup}>
                          <TextField label={label}
                                     type="text"
                                     select
                                     value={columnMap && columnMap[value] || ''}
                                     placeholder={label}
                                     required={value !== SPREADSHEET_COLUMNS.DETAILS}
                                     error={columnMapErrors && columnMapErrors[value] || ''}
                                     helperText={columnMapErrors && columnMapErrors[value] || ''}
                                     onChange={e => updateColumnMap(value, e.target.value)}
                          >
                            {(sheetData && sheetData[0] || []).map(columnName => {
                              const selectedColumnNames = Object.keys(columnMap).map(key => columnMap[key]);
                              if (!selectedColumnNames.includes(columnName) || columnMap[value] === columnName) {
                                return (
                                  <MenuItem key={columnName}
                                            value={columnName}>
                                    {columnName}
                                  </MenuItem>
                                );
                              }
                              return null;
                            })}
                          </TextField>
                        </FormGroup>
                      );
                    })}
                  </>
                )}
              </>
            ) || null}
          </>
        ) || null}

        <div className={clsx(dialogClasses.dialogActions, dialogClasses.dialogActionsGrid)}>
          <Grid container
                direction="row"
                justify="space-between"
                wrap="nowrap">
            <Button type="button"
                    color="primary"
                    variant="outlined"
                    onClick={() => {
                      if (nextDialog) {
                        openDialog(nextDialog);
                      } else {
                        closeDialog();
                      }
                    }}>
              Cancel
            </Button>
            <Button type="submit"
                    color="primary"
                    variant="contained"
                    disabled={saving || !isSpreadsheetSelected || !isSheetSelected || !columnMap || (
                      (
                        isPaymentRequestsStep && (
                          !columnMap[SPREADSHEET_COLUMNS.RECIPIENT] || !columnMap[SPREADSHEET_COLUMNS.CURRENCY] || !columnMap[SPREADSHEET_COLUMNS.AMOUNT] || !columnMap[SPREADSHEET_COLUMNS.DUE_DATE]
                        )
                      ) ||
                      (
                        !isPaymentRequestsStep && (
                          !columnMap[SPREADSHEET_COLUMNS.NAME] || !columnMap[SPREADSHEET_COLUMNS.EMAIL] || !columnMap[SPREADSHEET_COLUMNS.ADDRESS]
                        )
                      )
                    )}>
              {isPaymentRequestsStep?'Save':'Next'}
            </Button>
          </Grid>
        </div>
      </form>
    </Dialog>
  );
};