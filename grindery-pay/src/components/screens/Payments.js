import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CircularProgress, FormControlLabel,
  Grid,
  Switch,
} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import _ from 'lodash';
import clsx from 'clsx';

import Copy from '../shared/Copy';
import FilterTabs from '../shared/FilterTabs';
import SearchAndAdd from '../shared/SearchAndAdd';
import TransactionsList from '../shared/TransactionsList';

import AppContext from '../../AppContext';

import {DIALOG_ACTIONS, PAYMENT_DUE_STATES, PAYMENT_VIEWS, SCREENS} from '../../helpers/contants';
import {
  getPendingPayments,
  getInitials,
  getPaymentContact,
  getPaymentDueDisplay, getPaymentDueState, searchItems,
  transactionFinder,
  truncateAddress
} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {cardStyles} from '../../helpers/style';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  content: {
    padding: theme.spacing(1.5, 2, 2),
    '& > *': {
      width: '100%',
    }
  },
  footerActions: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    bottom: 0,
    zIndex: 1,
    padding: theme.spacing(1.25, 0),
    background: '#fff',
    boxShadow: 'inset 0 1px 0px rgba(0, 0, 0, 0.1)',
  },
  headerInfo: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
    opacity: 0.6,
  },
  toggleContainer: {
    width: '100%',
    display: 'flex',
    margin: 0,
    justifyContent: 'space-between',
  },
  payButton: {
    width: '100%',
  },
  bold: {
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  emptyActions: {
    textAlign: 'center',
    margin: theme.spacing(3, 0),
    '& > *': {
      marginBottom: theme.spacing(2),
    }
  },
  filterGroup: {
    marginBottom: theme.spacing(2.5),
  },
  filterLabel: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: theme.spacing(1),
  },
}));

export default () => {
  const classes = useStyles();
  const cardClasses = cardStyles();
  const {screenTab, currency, contacts, payments, transactions, changeScreen, openDialog, convertToCrypto, getPayments, getTransactions, syncDataAndRefresh} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [currentFilter, setCurrentFilter] = useState(screenTab || null);
  const [search, setSearch] = useState('');
  const [select, setSelect] = useState(true);

  useEffect(() => {
    // Load payments
    setLoading(true);
    setError(null);

    syncDataAndRefresh().then(() => {
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(ERROR_MESSAGES.READ_PAYMENTS_FAILED);
    });

  },[]);

  useEffect(() => {
    if(!select && selectedPayments && selectedPayments.length) {
      setSelectedPayments([]);
    }
  }, [select]);

  const togglePayment = (payment, groupIdx) => {
    let newSelectPayments = [...selectedPayments];
    const currentIdx = newSelectPayments.findIndex(i => i.index === groupIdx);
    if (currentIdx > -1) {
      // Remove
      newSelectPayments = newSelectPayments.filter(i => i.index !== groupIdx);
    } else {
      // Add
      newSelectPayments.push({...payment, index: groupIdx});
    }
    // Filter out paid payments :-)
    newSelectPayments = getPendingPayments(newSelectPayments, transactions);
    setSelectedPayments(newSelectPayments);
  };

  const onAddPayment = e => {
    e && e.preventDefault();
    openDialog(DIALOG_ACTIONS.ADD_PAYMENT);
  };

  const onAddContact = e => {
    e && e.preventDefault();
    openDialog(DIALOG_ACTIONS.ADD_CONTACT);
  };

  const goToSettings = e => {
    e && e.preventDefault();
    changeScreen(SCREENS.SETTINGS);
  };

  const onPay = () => {
    openDialog(DIALOG_ACTIONS.MAKE_PAYOUT, {
      payments: (selectedPayments || []).map(payment => _.omit(payment, ['contact']))
    });
  };

  const onClickPayment = (payment, groupIdx) => {
    if(select) {
      togglePayment(payment, groupIdx);
    } else {

    }
  };

  useEffect(() => {
    setSelectedPayments(getPendingPayments(selectedPayments, transactions));
  }, [transactions]);

  const pendingPayments = (getPendingPayments(payments, transactions) || []).map(payment => {
    return {
      ...payment,
      contact: getPaymentContact(payment, contacts),
    };
  });

  const FILTERS = [
    PAYMENT_VIEWS.ALL, PAYMENT_VIEWS.DUE,
    //PAYMENT_VIEWS.DUE_TODAY, PAYMENT_VIEWS.DUE_SOON,
    PAYMENT_VIEWS.OVERDUE, PAYMENT_VIEWS.IN_PROGRESS
  ];

  const pendingPaymentResults = searchItems(
    search, pendingPayments, [
      'name', 'email', 'address',
      'contact.name', 'contact.email', 'contact.address',
    ]
  );

  return (
    <div className={classes.container}>
      <FilterTabs items={FILTERS} selectedItem={currentFilter} onChange={setCurrentFilter}/>

      <div className={classes.content}>
        <SearchAndAdd placeholder="Pending Payments"
                      onSearch={value => setSearch(value || '')}
                      onAdd={onAddPayment} />

        {/*
        <FormControlLabel
          control={
            <Switch
              name="select_mode"
              color="secondary"
              checked={select}
              onChange={() => setSelect(!select)}
            />
          }
          label="Multiselect payments"
          labelPlacement="start"
          className={classes.toggleContainer}
          classes={{
            label: classes.settingsLabel,
          }}
        />
        */}

        {loading && (
          <div className={classes.loading}>
            <CircularProgress size={30}/>
          </div>
        ) || (
          currentFilter === PAYMENT_VIEWS.IN_PROGRESS && (
            <TransactionsList transactions={transactions.filter(transaction => (typeof transaction.confirmed === 'boolean' && (!transaction.confirmed || (transaction.delegated && !transaction.delegatedConfirmed))))}
                              search={search}
                              error={error}/>
          ) || (
            <>
              {pendingPayments && pendingPayments.length && (
                <>
                  {[
                    [PAYMENT_DUE_STATES.DUE_TODAY, PAYMENT_VIEWS.DUE_TODAY],
                    [PAYMENT_DUE_STATES.DUE_SOON, PAYMENT_VIEWS.DUE_SOON],
                    [PAYMENT_DUE_STATES.OVERDUE, PAYMENT_VIEWS.OVERDUE],
                  ].filter(([, filter]) => (filter === currentFilter || (currentFilter === PAYMENT_VIEWS.DUE && [PAYMENT_VIEWS.DUE_TODAY, PAYMENT_VIEWS.DUE_SOON].includes(filter)) || (currentFilter === PAYMENT_VIEWS.ALL || !currentFilter))).map(([dueState, filter]) => {
                    const statePayments = (pendingPaymentResults || []).filter(payment => getPaymentDueState(payment) === dueState);
                    if(statePayments && statePayments.length) {
                      const showLabels = [PAYMENT_VIEWS.ALL, PAYMENT_VIEWS.DUE].includes(currentFilter);
                      return (
                        <div className={showLabels && classes.filterGroup || ''}>
                          {showLabels && (
                            <div className={classes.filterLabel}>
                              {filter}
                            </div>
                          ) || null}
                          <div>
                            {statePayments.map((payment, idx) => {
                              const contact = payment.contact || getPaymentContact(payment, contacts),
                                transaction = transactionFinder(transactions, payment) || null,
                                isPaid = transaction && (typeof transaction.confirmed !== 'boolean' || transaction.confirmed),
                                isProcessing = transaction && (typeof transaction.confirmed === 'boolean' && !transaction.confirmed);
                              const groupIdx = `${dueState}_${idx}`;

                              return (
                                <Card className={clsx(cardClasses.container, {'selected': selectedPayments.findIndex(i => i.index === groupIdx) > -1})}
                                      onClick={() => !transaction && onClickPayment(payment, groupIdx)}>
                                  <CardContent className={cardClasses.content}>
                                    <Avatar
                                      className={cardClasses.avatar}>{getInitials(contact && contact.name || payment.name)}</Avatar>
                                    <div
                                      className={cardClasses.detailsContainer}>
                                      <Grid container
                                            direction="row"
                                            justify="space-between">
                                        <div className={cardClasses.header}>
                                          {contact && contact.name || payment.name}
                                        </div>

                                        <div className={clsx(cardClasses.header, cardClasses.bold)}>
                                          ${payment.amount}
                                        </div>
                                      </Grid>
                                      <Grid container
                                            direction="row"
                                            justify="space-between">
                                        <Copy text={payment.address}>
                                          <div className={cardClasses.subheader}>
                                            {truncateAddress(payment.address)}
                                          </div>
                                        </Copy>

                                        <div className={cardClasses.subheader} style={{whiteSpace: 'nowrap'}}>
                                          {currency && (
                                            <>
                                              {convertToCrypto(payment.amount)}{' '}{currency}
                                            </>
                                          ) || ' '}
                                        </div>
                                      </Grid>
                                    </div>
                                    <div className={cardClasses.actions}>
                                      <div className={clsx(cardClasses.status, {
                                        [cardClasses.statusSuccess]: isPaid,
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
                    return null;
                  })}
                </>
              ) || (
                <>
                  <Alert severity={error && 'error' || 'info'}>
                    {error || (
                      <>
                        {contacts.length && (
                          <>
                            <div>{payments && payments.length ? ERROR_MESSAGES.NO_PENDING_PAYMENTS : ERROR_MESSAGES.NO_PAYMENTS}</div>
                          </>
                        ) || (
                          <>
                            <div>{ERROR_MESSAGES.NO_PAYMENTS_AND_NO_CONTACTS}</div>
                          </>
                        )}
                      </>
                    )}
                  </Alert>

                  <div className={classes.emptyActions}>
                    {contacts.length && (
                      <Button type="button"
                              color="primary"
                              variant="outlined"
                              onClick={onAddPayment}>
                        Create a payment
                      </Button>
                    ) || (
                      <>
                        <Button type="button"
                                color="primary"
                                variant="outlined"
                                onClick={onAddContact}>
                          Add a Contact
                        </Button>

                        <Button type="button"
                                color="primary"
                                variant="outlined"
                                onClick={goToSettings}>
                          Configure an Integration
                        </Button>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          )
        )}

        {(select && selectedPayments.length > 0 && currentFilter !== PAYMENT_VIEWS.IN_PROGRESS) && (
          <div className={classes.footerActions}>
            <Button type="button"
                    color="primary"
                    variant="contained"
                    className={classes.payButton}
                    disabled={!(selectedPayments || []).length}
                    onClick={onPay}>
              Create batch payment
            </Button>
            {/*
            <div className={classes.headerInfo}>
              {(selectedPayments || []).length} of {(pendingPayments || []).length} selected
            </div>
            */}
          </div>
        ) || null}
      </div>
    </div>
  );
};