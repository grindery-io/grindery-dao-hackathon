import React, {useContext, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Button,
  FormGroup, Grid,
  TextField
} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import Web3 from 'web3';
import moment from 'moment';
import clsx from 'clsx';

import Dialog, {useStyles as dialogStyles} from '../containers/Dialog';

import AppContext from '../../AppContext';

import {ADDRESS_EXAMPLE} from '../../helpers/contants';
import {truncateAddress} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';


const useStyles = makeStyles((theme) => ({
  alert: {
    margin: theme.spacing(0, 0, 2),
  },
  formGroup: {
    marginBottom: theme.spacing(2),
  },
}));

export default ({nextDialog}) => {
  const classes = useStyles();
  const dialogClasses = dialogStyles();
  const {closeDialog, openDialog, addContact} = useContext(AppContext);

  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState(null);
  const [formError, setFormError] = useState(null);

  const updateData = (key, value) => {
    setData({...(data || {}), [key]: value || ''});
    if (errors && errors[key]) {
      let newErrors = {...(errors || {})};
      delete newErrors[key];
      setErrors(newErrors);
    }
    if(formError) {
      setFormError(null);
    }
  };

  const saveContact = e => {
    e.preventDefault();

    let errors = {};

    setSaving(true);
    setErrors(null);
    setFormError(null);
    for (const key of ['name', 'address']) {
      if (!data || !data[key]) {
        errors[key] = ERROR_MESSAGES.REQUIRED;
      }
    }

    if(data && data.address && !Web3.utils.isAddress(data.address)) {
      errors.address = ERROR_MESSAGES.INVALID_WALLET_ADDRESS;
    }

    if (Object.keys(errors).length) {
      setSaving(false);
      setErrors(errors);
    } else {
      setSaving(false);
      addContact({
        ...data,
        created_at: moment.utc().format(),
      }).then(res => {
        if(nextDialog) {
          openDialog({...nextDialog, contact: data});
        } else {
          closeDialog();
        }
      }).catch(e => {
        setFormError(e && e.message || ERROR_MESSAGES.UNKNOWN);
      });
    }
  };

  return (
    <Dialog title="Add Contact"
            ariaLabel="add contact">
      <form onSubmit={saveContact}>
        {formError && (
          <Alert severity="error" className={classes.alert}>{formError || ''}</Alert>
        ) || null}

        <FormGroup className={classes.formGroup}>
          <TextField label="Name"
                     type="text"
                     value={data && data.name || ''}
                     placeholder="Name"
                     required={true}
                     error={errors && errors.name || ''}
                     helperText={errors && errors.name || ''}
                     onChange={e => updateData('name', e.target.value)}/>
        </FormGroup>

        <FormGroup className={classes.formGroup}>
          <TextField label="Email"
                     type="email"
                     value={data && data.email || ''}
                     placeholder="Email"
                     required={true}
                     error={errors && errors.email || ''}
                     helperText={errors && errors.email || ''}
                     onChange={e => updateData('email', e.target.value)}/>
        </FormGroup>

        <FormGroup className={classes.formGroup}>
          <TextField label="Wallet Address"
                     type="text"
                     value={data && data.address || ''}
                     placeholder={truncateAddress(ADDRESS_EXAMPLE, 8, 6)}
                     required={true}
                     error={errors && errors.address || ''}
                     helperText={errors && errors.address || `e.g ${truncateAddress(ADDRESS_EXAMPLE, 8, 6)}`}
                     onChange={e => updateData('address', e.target.value)}/>
        </FormGroup>

        <div className={clsx(dialogClasses.dialogActions, dialogClasses.dialogActionsGrid)}>
          <Grid container
                direction="row"
                justify="space-between"
                wrap="nowrap">
            <Button type="button"
                    color="primary"
                    variant="outlined"
                    onClick={() => {
                      if(nextDialog) {
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
                    disabled={saving}>
              Save
            </Button>
          </Grid>
        </div>
      </form>
    </Dialog>
  );
};