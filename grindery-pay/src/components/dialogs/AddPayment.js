import React, {useContext, useEffect, useRef, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Button,
  FormGroup,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
} from '@material-ui/core';
import {Add as AddIcon} from '@material-ui/icons';
import {Alert} from '@material-ui/lab';
import Decimal from 'decimal.js';
import {
  DatePicker,
} from '@material-ui/pickers';
import moment from 'moment';
import Web3 from 'web3';
import _ from 'lodash';
import clsx from 'clsx';

import Dialog, {useStyles as dialogStyles} from '../containers/Dialog';

import AppContext from '../../AppContext';

import {DIALOG_ACTIONS} from '../../helpers/contants';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {truncateAddress} from '../../helpers/utils';
import {theme} from '../../helpers/style';

const useStyles = makeStyles((theme) => ({
  alert: {
    margin: theme.spacing(0, 0, 2),
  },
  formGroup: {
    marginBottom: theme.spacing(2),
  },
  selectIcon: {
    right: 36,
  },
  contactItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  contactItemInfo: {
    fontSize: 14,
    lineHeight: 1.2,
    opacity: 0.4,
  },
  amountGrid: {
    '& > *': {
      width: `calc(50% - ${theme.spacing(1)}px)`,
    }
  },
}));

export default ({initialData, contact, nextDialog}) => {
  const classes = useStyles();
  const dialogClasses = dialogStyles();
  const {currency, contacts, openDialog, closeDialog, convertToCrypto, convertToFiat, addPayment} = useContext(AppContext);

  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState(null);
  const [formError, setFormError] = useState(null);

  const submitRef = useRef('');

  const getContactID = contact => `${contact.address || ''}|${contact.email || ''}`;

  useEffect(() => {
    if (!data || !data.due_date) {
      setData({...(data || {}), due_date: moment.utc().format()})
    }
  }, []);

  useEffect(() => {
    if (initialData || contact) {
      let newData;
      if (initialData) {
        newData = {...(initialData || {})};
      } else {
        newData = {...(initialData || {})};
      }
      if (contact && (contact.address || contact.email)) {
        newData.contact = getContactID(contact);
      }
      if (newData) {
        setData(newData);
      }
    }
  }, [initialData, contact]);

  useEffect(() => {
    if (data) {
      if (data.inputCurrency && data.inputCurrency !== 'USD') {
        onCryptoChange(data.value);
      } else {
        onFiatChange(data.amount);
      }
    }
  }, [currency]);

  const onFiatChange = amount => {
    setData({
      ...(data || {}),
      amount: amount || '',
      value: amount && convertToCrypto(amount) || '',
      inputCurrency: 'USD',
    });
    if (errors && errors.amount) {
      let newErrors = {...(errors || {})};
      delete newErrors.amount;
      setErrors(newErrors);
    }
  }

  const onCryptoChange = value => {
    setData({
      ...(data || {}),
      value: value || '',
      amount: value && convertToFiat(value) || '',
      inputCurrency: currency,
    });
    if (errors && errors.amount) {
      let newErrors = {...(errors || {})};
      delete newErrors.amount;
      setErrors(newErrors);
    }
  }

  const getInputDate = value => {
    return new Date((value && moment.utc(value).isValid() && moment.utc(value) || moment.utc()).format());
  };

  const updateData = (key, value) => {
    setData({...(data || {}), [key]: value || ''});
    if (errors && errors[key]) {
      let newErrors = {...(errors || {})};
      delete newErrors[key];
      setErrors(newErrors);
    }
  };

  const savePayment = e => {
    e.preventDefault();
    let errors = {},
      payload = _.omit(data || {}, ['contact']);

    setSaving(true);
    setErrors(null);

    for (const key of ['contact', 'amount', 'due_date', 'details']) {
      const value = data && data[key];
      if (value) {
        if (key === 'contact') {
          const [address, email] = (value || '').split('|').map(i => (i || '').trim());
          if (address && Web3.utils.isAddress(address)) {
            payload.address = address;
          } else {
            errors.contact = ERROR_MESSAGES.INVALID_WALLET_ADDRESS;
          }

          if (email) {
            payload.email = email;
          }
        } else {
          payload[key] = value;
        }
      } else if (key !== 'details') {
        errors[key] = ERROR_MESSAGES.REQUIRED;
      }
    }

    if (payload.amount) {
      const amount = new Decimal(payload.amount);
      if (amount.gt(0)) {
        payload.amount = amount.toNumber();
      } else {
        errors.amount = ERROR_MESSAGES.INVALID_AMOUNT;
      }
    }

    if (Object.keys(errors).length) {
      setSaving(false);
      setErrors(errors);
    } else {
      setSaving(false);
      addPayment({
        ...payload,
        created_at: moment.utc().format(),
      }).then(res => {
        if (submitRef.current === 'pay_now') {
          openDialog(DIALOG_ACTIONS.MAKE_PAYOUT, {payments: [data], nextDialog});
        } else if (nextDialog) {
          openDialog({...nextDialog, payment: data});
        } else {
          closeDialog();
        }
      }).catch(e => {
        setFormError(e && e.message || ERROR_MESSAGES.UNKNOWN);
      });
    }
  };

  const onClose = () => {
    if (nextDialog) {
      openDialog(nextDialog);
    } else {
      closeDialog();
    }
  };

  return (
    <Dialog title={(
      <>
        <div style={{textAlign: 'left', marginBottom: theme.spacing(1.25)}}>
          Register a Liability
        </div>
        <div style={{textAlign: 'left', fontSize: 14, lineHeight: 1.5}}>
          A liability is an open invoice, a net salary payment or anything else you want or need to pay.
        </div>
      </>
    )}
            ariaLabel="register a liability"
            onClose={onClose}>
      <form onSubmit={savePayment}>
        {formError && (
          <Alert severity="error" className={classes.alert}>{formError || ''}</Alert>
        ) || null}

        <FormGroup className={classes.formGroup}>
          <TextField label="Contact"
                     type="text"
                     select
                     value={data && data.contact || ''}
                     placeholder="Contact"
                     required={true}
                     error={errors && errors.contact || ''}
                     helperText={errors && errors.contact || ''}
                     InputProps={{
                       endAdornment: (
                         <InputAdornment position="end">
                           <IconButton aria-label="add contact"
                                       color="secondary"
                                       onClick={() => openDialog(DIALOG_ACTIONS.ADD_CONTACT, {
                                         nextDialog: {
                                           action: DIALOG_ACTIONS.ADD_PAYMENT,
                                           initialData: data
                                         }
                                       })}>
                             <AddIcon/>
                           </IconButton>
                         </InputAdornment>
                       ),
                     }}
                     SelectProps={{
                       classes: {
                         icon: classes.selectIcon,
                       }
                     }}
                     onChange={e => updateData('contact', e.target.value)}>
            {(contacts || []).map(item => {
              if (item) {
                const value = getContactID(item),
                  label = item.name || item.email || item.address || '';
                return (
                  <MenuItem key={value}
                            value={value}
                            className={classes.contactItem}>
                    <div>{label}</div>
                    {item.email && item.email !== label && (
                      <div className={classes.contactItemInfo}>{item.email}</div>
                    )}
                    {item.address && item.address !== label && (
                      <div className={classes.contactItemInfo}>{truncateAddress(item.address, 8, 6)}</div>
                    )}
                  </MenuItem>
                );
              }
              return null;
            })}
          </TextField>
        </FormGroup>

        <FormGroup className={classes.formGroup}>
          <Grid container
                direction="row"
                justify="space-between"
                wrap="nowrap"
                className={clsx({[classes.amountGrid]: currency})}>
            <TextField label="Amount"
                       type="text"
                       value={data && data.amount || ''}
                       placeholder="0.00"
                       required={true}
                       error={errors && errors.amount}
                       helperText={errors && errors.amount || ''}
                       onChange={e => onFiatChange(e.target.value)}
                       InputProps={{
                         inputProps: {
                           pattern: '^\\d+(\\.\\d{1,2})?$',
                         },
                         startAdornment: (
                           <InputAdornment position="start">$</InputAdornment>
                         ),
                       }}/>
            {currency && (
              <TextField label="Value"
                         type="text"
                         value={data && data.value || ''}
                         placeholder="0.0000"
                         required={false}
                         error={errors && errors.value}
                         helperText={errors && errors.value || ''}
                         onChange={e => onCryptoChange(e.target.value)}
                         InputProps={{
                           inputProps: {
                             pattern: '^\\d+(\\.\\d{1,4})?$',
                           },
                           endAdornment: (
                             <InputAdornment position="end">{currency}</InputAdornment>
                           ),
                         }}/>
            ) || null}
          </Grid>
        </FormGroup>

        <FormGroup className={classes.formGroup}>
          <TextField label="Details"
                     type="text"
                     value={data && data.details || ''}
                     placeholder="Details"
                     required={false}
                     error={errors && errors.details}
                     helperText={errors && errors.details || ''}
                     onChange={e => updateData('details', e.target.value)}
          />
        </FormGroup>

        <FormGroup className={classes.formGroup}>
          <DatePicker variant="inline"
                      name="due_date"
                      label="Due Date"
                      placeholder={moment.utc().format('DD/MM/YYYY')}
                      format="dd/MM/yyyy"
                      required={true}
                      value={getInputDate(data && data.due_date || '')}
                      onChange={date => {
                        const newDate = (date && moment.utc(date).isValid() && moment.utc(date) || moment.utc()).format();
                        updateData('due_date', newDate)
                      }}
                      KeyboardButtonProps={{
                        'aria-label': 'due date'
                      }}
          />
          {errors && errors.due_date && (
            <FormHelperText error={true}>{errors && errors.due_date || ''}</FormHelperText>
          )}
        </FormGroup>

        <div className={clsx(dialogClasses.dialogActions, dialogClasses.dialogActionsGrid)}>
          <Grid container
                direction="row"
                justify="space-between"
                wrap="nowrap">
            <Button type="submit"
                    color="primary"
                    variant="outlined"
                    disabled={saving}
                    onClick={onClose}>
              Cancel
            </Button>
            {/*
            <Button type="submit"
                    color="primary"
                    variant="outlined"
                    disabled={saving}
                    onClick={() => {
                      submitRef.current = 'pay_now';
                    }}>
              Pay Now
            </Button>
            */}
            <Button type="submit"
                    color="primary"
                    variant="contained"
                    disabled={saving}
                    onClick={() => {
                      submitRef.current = 'save';
                    }}>
              Save
            </Button>
          </Grid>
        </div>
      </form>
    </Dialog>
  );
};