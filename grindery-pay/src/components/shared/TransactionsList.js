import React, {useContext, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Avatar,
  Card,
  CardContent,
  Grid,
} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import clsx from 'clsx';
import moment from 'moment';
import Decimal from 'decimal.js';

import Copy from '../shared/Copy';

import AppContext from '../../AppContext';

import {
  getInitials,
  getPaymentContact,
  getPaymentDueDisplay,
  getPaymentsTotal, searchItems,
  truncateAddress
} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {cardStyles} from '../../helpers/style';
import {
  DIALOG_ACTIONS,
  TRANSACTION_DIRECTIONS, PAYMENT_OPTIONS,
} from '../../helpers/contants';

import arrowLeft from '../../images/long-arrow-left.svg';
import arrowRight from '../../images/long-arrow-right.svg';

const useStyles = makeStyles((theme) => ({
  bold: {
    fontWeight: 'bold',
  },
  light: {
    fontSize: 12,
    opacity: 0.4,
    '&.highlight': {
      opacity: 1,
    }
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  transaction: {
    marginBottom: theme.spacing(2.5),
    cursor: 'pointer',
  },
  transactionHeader: {
    padding: theme.spacing(0, 0.5),
    marginBottom: theme.spacing(1),
  },
  transactionAmounts: {
    lineHeight: 1,
    '& > *': {
      display: 'inline-block',
    },
    '& > *:not(:last-child)': {
      paddingRight: theme.spacing(1),
      marginRight: theme.spacing(1),
      borderRight: `1px solid ${theme.palette.common.black}`,
    }
  },
}));

export default ({transactions, search, error}) => {
  const classes = useStyles();
  const cardClasses = cardStyles();
  const {contacts, openDialog, getNetworkById} = useContext(AppContext);

  const [highlight, setHighlight] = useState(-1);

  const payableToDisplayValue = (value, chain) => {
    if(value && chain) {
      const network = chain && getNetworkById(chain) || null;
      if(network) {
        const decimals = network && network.nativeCurrency && network.nativeCurrency.decimals || null;
        return new Decimal(value || 0).dividedBy(new Decimal(10).pow(decimals || 18).toNumber()).toFixed(4);
      }
    }
    return 0;
  };

  let filteredTransactions = transactions.map(transaction => {
    return {
      ...transaction,
      ...(transaction.payment?{
        payment: {
          ...transaction.payment,
          contact: getPaymentContact(transaction.payment, contacts),
        }
      }:{}),
      ...(transaction.payments && Array.isArray(transaction.payments)?{
        payments: (transaction.payments || []).map(payment => {
          return {
            ...payment,
            contact: getPaymentContact(payment, contacts),
          };
        }),
      }:{})
    }
  });

  const transactionResults = searchItems(
    search, filteredTransactions, [
      'from', 'sender', 'name', 'email', 'address',
      'payment.name', 'payment.email', 'payment.address',
      'payments.name', 'payments.email', 'payments.address',
      'payment.contact.name', 'payment.contact.email', 'payment.contact.address',
      'payments.contact.name', 'payments.contact.email', 'payments.contact.address',
    ]
  );

  return (
    <>
      {filteredTransactions && filteredTransactions.length && (
        (transactionResults || []).map((transaction, idx) => {
          if(transaction) {
            const displayValue = payableToDisplayValue(transaction.value, transaction.chain),
              isPaid = transaction && (
                typeof transaction.confirmed !== 'boolean' ||
                (transaction.confirmed && !transaction.delegated) ||
                (transaction.delegated && transaction.delegatedConfirmed)
              ),
              isProcessing = !isPaid && typeof transaction.confirmed === 'boolean';

            let transactionPayments = [],
              paymentValues = [];

            if(transaction.payment) {
              transactionPayments.push(transaction.payment);
              paymentValues.push(transaction.value || 0);
            }

            if(transaction.payments && Array.isArray(transaction.payments)) {
              const transactionValues = transaction.values && Array.isArray(transaction.values) && transaction.values || [];
              for (const [idx, payment] of (transaction.payments || []).entries()) {
                transactionPayments.push(payment);
                paymentValues.push(transactionValues[idx] || 0);
              }
            }

            if(transactionPayments && transactionPayments.length) {
              return (
                <div className={classes.transaction}
                     onClick={e => {
                       openDialog(DIALOG_ACTIONS.MAKE_PAYOUT, {
                         payments: transactionPayments,
                         readonly: true,
                         state: {
                           paymentMethod: transaction.paymentMethod || (transaction.delegated && PAYMENT_OPTIONS.DELEGATED_TRANSFER) || PAYMENT_OPTIONS.DEFAULT,
                           delegatedAddress: transaction.delegatedAddress || transaction.smartAddress || null,
                           ...(transaction.paymentMethod === PAYMENT_OPTIONS.ARAGON && transaction.aragon?{
                             aragon: transaction.aragon,
                           }:{}),
                           ...(transaction.paymentMethod === PAYMENT_OPTIONS.GNOSIS && transaction.gnosis?{
                             gnosis: transaction.gnosis,
                           }:{}),
                         },
                         status: isPaid?'Paid':'In Progress',
                       });
                     }}
                     onMouseOver={e => {
                       setHighlight(idx);
                     }}
                     onMouseOut={e => {
                       setHighlight(-1);
                     }}>
                  <Grid container
                        direction="row"
                        justify="space-between"
                        alignItems="center"
                        className={classes.transactionHeader}>
                    <div className={clsx(classes.light, {
                      'highlight': highlight === idx,
                    })}>
                      {transaction.paid_at && moment.utc(transaction.paid_at).format('DD.MMMM.YYYY') || null}
                    </div>

                    <div className={classes.transactionAmounts}>
                      {displayValue && transaction.currency && (
                        <span className={clsx(classes.light, {
                          'highlight': highlight === idx,
                        })}>
                              {displayValue}{' '}{transaction.currency}
                            </span>
                      ) || null}
                      <span className={classes.bold}>
                            ${getPaymentsTotal(transactionPayments)}
                          </span>
                    </div>
                  </Grid>
                  <div className={cardClasses.group}>
                    {transactionPayments.map((payment, subIdx) => {
                      const contact = payment.contact || getPaymentContact(payment, contacts),
                        paymentDisplayValue = payableToDisplayValue(paymentValues[subIdx], transaction.chain);

                      let transactorName = null,
                        transactorAddress = null;
                      if(transaction.direction === TRANSACTION_DIRECTIONS.IN) {
                        transactorName = transaction.sender;
                        transactorAddress = transaction.from;
                      } else {
                        transactorName = (contact && contact.name) || (payment && payment.name);
                        transactorAddress = (contact && contact.address) || (payment && payment.address);
                      }

                      /*
                      onClick={e => {
                                openDialog(DIALOG_ACTIONS.SHOW_TRANSACTION_DETAILS, {
                                  transaction: transaction,
                                  payment: payment
                                });
                              }}
                      */
                      return (
                        <Card className={clsx(cardClasses.container, {
                          'highlight': highlight === idx,
                        })}>
                          <CardContent className={cardClasses.content}>
                            <div className={cardClasses.avatarContainer}>
                              <Avatar className={cardClasses.avatar}>{getInitials(transactorName)}</Avatar>
                              <img src={transaction.direction === TRANSACTION_DIRECTIONS.IN?arrowRight:arrowLeft}
                                   className={cardClasses.avatarExtraIcon}/>
                            </div>
                            <div className={cardClasses.detailsContainer}>
                              <Grid container
                                    direction="row"
                                    justify="space-between">
                                <div className={cardClasses.header}>
                                  {transactorName}
                                </div>

                                <div className={cardClasses.header}>
                                  ${payment.amount}
                                </div>
                              </Grid>
                              <Grid container
                                    direction="row"
                                    justify="space-between">
                                <Copy text={transactorAddress}>
                                  <div className={cardClasses.subheader}>
                                    {truncateAddress(transactorAddress)}
                                  </div>
                                </Copy>

                                <div className={cardClasses.subheader} style={{whiteSpace: 'nowrap'}}>
                                  {paymentDisplayValue && transaction.currency && (
                                    <>
                                      {paymentDisplayValue}{' '}{transaction.currency}
                                    </>
                                  ) || ' '}
                                </div>
                              </Grid>
                            </div>
                            <div className={cardClasses.actions}>
                              <div className={clsx(cardClasses.status, {
                                [cardClasses.statusPaid]: isPaid,
                                [cardClasses.statusInfo]: isProcessing,
                              })}>
                                {(isPaid && 'Paid') || (isProcessing && (
                                  <>
                                    <div>In</div>
                                    <div>Progress</div>
                                  </>
                                )) || getPaymentDueDisplay(payment)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            }
          }
          return null;
        })
      ) || (
        <Alert severity={error && 'error' || 'info'}>{error || ERROR_MESSAGES.NO_TRANSACTIONS}</Alert>
      )}
    </>
  );
};