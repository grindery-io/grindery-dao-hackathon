import React, {useContext, useEffect} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Button, Card, CardContent, Grid, IconButton, Typography} from '@material-ui/core';
import {Add as AddIcon, ArrowForward as ArrowForwardIcon} from '@material-ui/icons';

import AppContext from '../../AppContext';

import useSmartWalletBalance from '../../hooks/useSmartWalletBalance';

import {DIALOG_ACTIONS, FIAT_CURRENCIES, PAYMENT_VIEWS, SCREENS} from '../../helpers/contants';
import {getPendingPayments, getPaymentsTotal, getInProgressPayments} from '../../helpers/utils';

import contactsIcon from '../../images/contacts.svg';
import paymentsIcon from '../../images/payments-purple.svg';
import walletIcon from '../../images/wallet-purple.svg';
import fundIcon from '../../images/fund-purple.svg';
import withdrawIcon from '../../images/withdraw-purple.svg';


const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  card: {
    textAlign: 'left',
    marginBottom: theme.spacing(2.5),
    borderRadius: 10,
    boxShadow: 'inset 0 1px 0px rgba(0, 0, 0, 0.1), inset -1px 0 0 rgba(0, 0, 0, 0.1), inset 0 -1px 0px rgba(0, 0, 0, 0.1), inset 1px 0 0 rgba(0, 0, 0, 0.1)',
    '&:last-child': {
      marginBottom: 0,
    },
    '& button': {
      fontSize: 12,
      lineHeight: 1.5,
      //borderRadius: 100,
    },
    '& button.disabled': {
      cursor: 'not-allowed',
    }
  },
  cardContent: {
    position: 'relative',
    padding: theme.spacing(2),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 1.5,
    color: '#0B0D17',
    marginBottom: theme.spacing(1.25),
    opacity: 0.6,
  },
  cardTitleIcon: {
    display: 'inline-block',
    height: 16,
    marginRight: theme.spacing(0.5),
    verticalAlign: 'middle',
  },
  cardAction: {
    position: 'absolute',
    top: theme.spacing(0.5),
    right: theme.spacing(0.5),
  },
  cardAmount: {
    fontSize: 40,
    fontWeight: 300,
    textAlign: 'right',
    lineHeight: 1,
    //marginBottom: theme.spacing(1.25),
    marginBottom: 0,
  },
  cardAmountSmall: {
    fontSize: 12,
    fontWeight: 300,
    lineHeight: 1,
    //marginBottom: theme.spacing(1.25),
    marginTop: theme.spacing(1.25),
    marginBottom: 0,
  },
  cardAmountLight: {
    opacity: 0.4,
  },
  cardAmountIcon: {
    display: 'inline-block',
    height: 22,
    fill: '#0B0D17',
    marginRight: theme.spacing(1),
    verticalAlign: 'baseline',
    opacity: 0.2,
  },
  cardActionsContainer: {
    marginTop: theme.spacing(3.25),
  },
  cardActionButton: {
    textTransform: 'none',
  },
  cardActionIcon: {
    display: 'inline-block',
    height: 16,
    marginRight: theme.spacing(0.5),
    verticalAlign: 'middle',
  },
  fiatSelectContainer: {
    textAlign: 'right',
    marginBottom: theme.spacing(2.75),
  },
  fiatSelect: {
    fontSize: 14,
    lineHeight: 1.5,
  },
}));

export default () => {
  const classes = useStyles();
  const {currency, walletAddresses, networks, contacts, payments, transactions, changeScreen,getSmartWalletInfo, convertToCrypto, convertPayableToDisplayValue, convertToFiat, updateFiatCurrency, getTransactions} = useContext(AppContext);

  const networkId = networks && networks[0] || null,
    walletAddress = networkId && walletAddresses && walletAddresses[networkId] || null;

  const pendingPayments = getPendingPayments(payments, transactions),
    pendingFiatTotal = getPaymentsTotal(pendingPayments);

  const inProgressPayments = getInProgressPayments(payments, transactions),
    inProgressFiatTotal = getPaymentsTotal(inProgressPayments);

  const balance = useSmartWalletBalance(walletAddress, networkId, currency);

  useEffect(() => {
    getTransactions().catch(() => {});
  }, []);

  useEffect(() => {
    getSmartWalletInfo();
  }, [networkId]);

  const renderAmount = amount => {
    const parts = (amount || '').toString().split('.');
    return (
      <>
        <span className={classes.cardAmountLight}>$</span>
        <span>{parts[0] || 0}.</span>
        <span className={classes.cardAmountLight}>{parts[1] || '00'}</span>
      </>
    );
  };

  return (
    <div className={classes.container}>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h6" component="h3" className={classes.cardTitle}>
            <img src={contactsIcon} className={classes.cardTitleIcon}/> Contacts
          </Typography>
          <Typography gutterBottom variant="h2" component="h2" className={classes.cardAmount}>
            <img src={contactsIcon} className={classes.cardAmountIcon} height={18}/>
            <span>{contacts && contacts.length || 0}</span>
          </Typography>

          <IconButton color="secondary"
                      className={classes.cardAction}
                      onClick={() => changeScreen(SCREENS.CONTACTS, DIALOG_ACTIONS.ADD_CONTACT)}>
            <AddIcon/>
          </IconButton>
        </CardContent>
      </Card>

      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h6" component="h3" className={classes.cardTitle}>
            <img src={paymentsIcon} className={classes.cardTitleIcon}/> Pending payments
          </Typography>
          <Typography gutterBottom variant="h2" component="h2" className={classes.cardAmount}>
            {renderAmount(pendingFiatTotal)}
          </Typography>

          <IconButton color="secondary"
                      className={classes.cardAction}
                      onClick={() => changeScreen(SCREENS.PAYMENTS, DIALOG_ACTIONS.ADD_PAYMENT)}>
            <AddIcon/>
          </IconButton>
        </CardContent>
      </Card>

      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h6" component="h3" className={classes.cardTitle}>
            <img src={paymentsIcon} className={classes.cardTitleIcon}/> Batch payments in progress
          </Typography>
          <Typography gutterBottom variant="h2" component="h2" className={classes.cardAmount}>
            {renderAmount(inProgressFiatTotal)}
          </Typography>

          <IconButton color="secondary"
                      className={classes.cardAction}
                      onClick={() => changeScreen(SCREENS.PAYMENTS, null, null, PAYMENT_VIEWS.IN_PROGRESS)}>
            <ArrowForwardIcon/>
          </IconButton>
        </CardContent>
      </Card>

      {/*
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Typography gutterBottom variant="h6" component="h3" className={classes.cardTitle}>
            <img src={walletIcon} className={classes.cardTitleIcon}/> Smart Wallet
          </Typography>
          <Typography gutterBottom variant="h2" component="h2" className={classes.cardAmount}>
            {renderAmount(balance && balance[FIAT_CURRENCIES.USD] || 0.00)}
          </Typography>

          <Grid container
                direction="row"
                justify="space-evenly"
                alignItems="center"
                className={classes.cardActionsContainer}>
            <Button color="secondary"
                    className={classes.cardActionButton}
                    startIcon={(<img src={fundIcon} className={classes.cardActionIcon}/>)}
                    onClick={() => changeScreen(SCREENS.FUND)}>
              Fund
            </Button>
            <Button color="secondary"
                    className={classes.cardActionButton}
                    startIcon={(<img src={withdrawIcon} className={classes.cardActionIcon}/>)}
                    onClick={() => changeScreen(SCREENS.WITHDRAW)}>
              Withdraw
            </Button>
          </Grid>
        </CardContent>
      </Card>
      */}
    </div>
  );
};