import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Button, Grid} from '@material-ui/core';
import moment from 'moment';

import Dialog from '../containers/Dialog';
import Copy from '../shared/Copy';

import AppContext from '../../AppContext';

import {TRANSACTION_DIRECTIONS} from '../../helpers/contants';
import {getPaymentContact, truncateAddress} from '../../helpers/utils';

const useStyles = makeStyles((theme) => ({
  bold: {
    fontWeight: 'bold',
  },
  statusWrapper: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'center',
    marginBottom: theme.spacing(2.5),
    '& > *:last-child:not(:first-child)': {
      marginTop: theme.spacing(1.25),
    }
  },
  statusProcessing: {
    fontSize: 14,
  },
  statusSuccess: {
    color: theme.palette.success.main,
  },
  statusError: {
    color: theme.palette.error.main,
  },
  statusIcon: {
    fontSize: 50,
  },
  title: {
    fontSize: 25,
    lineHeight: 1.3,
    fontWeight: 'bold',
    textAlign: 'left',
    color: '#363636',
  },
  sender: {
    fontSize: 20,
    lineHeight: 1.3,
    color: '#363636',
    marginBottom: theme.spacing(0.5),
  },
  address: {
    fontSize: 20,
    lineHeight: 1.3,
    color: '#363636',
    marginBottom: theme.spacing(2.5),
    opacity: 0.5,
  },
  details: {
    fontSize: 16,
    lineHeight: 1.5,
    color: '#0B0D17',
    marginBottom: theme.spacing(2.5),
  },
  payoutDetails: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'center',
    marginBottom: theme.spacing(1.5),
  },
  crypto: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#0B0D17',
    opacity: 0.5,
  },
}));

export default ({payment, transaction, nextDialog, state}) => {
  const classes = useStyles();

  let {currency, contacts, openDialog, closeDialog, convertToCrypto} = useContext(AppContext);

  const fiatTotal = payment.amount,
    cryptoTotal = convertToCrypto(payment.amount);

  let transactorName = null,
    transactorAddress = null;
  if(transaction.direction === TRANSACTION_DIRECTIONS.IN) {
    transactorName = transaction.sender;
    transactorAddress = transaction.from;
  } else {
    const contact = payment.contact || getPaymentContact(payment, contacts);
    transactorName = (contact && contact.name) || (payment && payment.name);
    transactorAddress = (contact && contact.address) || (payment && payment.address);
  }

  return (
    <Dialog title={(<div className={classes.title}>${fiatTotal}</div>)}
            ariaLabel={`$${fiatTotal}`}
            actions={(
              <>
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
                  Close
                </Button>
              </>
            )}>

      <div className={classes.sender}>
        {transactorName || 'InboundLabs'}
      </div>

      <Copy text={transactorAddress}>
        <div className={classes.address}>
          {truncateAddress(transactorAddress)}
        </div>
      </Copy>

      <div className={classes.details}>
        Transaction Details<br/>
        {payment.details || ''}
      </div>

      <Grid container
            direction="row"
            justify="space-between"
            wrap="nowrap"
            className={classes.payoutDetails}>
        <div>Date</div>
        <div className={classes.bold} style={{textAlign: 'right'}}>
          <div>{transaction.paid_at && moment.utc(transaction.paid_at).format('DD.MMMM.YYYY') || null}</div>
          {currency && (
            <div className={classes.crypto}>{cryptoTotal}{' '}{currency}</div>
          ) || null}
        </div>
      </Grid>
    </Dialog>
  );
};