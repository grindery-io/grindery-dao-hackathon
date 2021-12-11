import React, {useContext, useEffect, useState} from 'react';
import {Button, FormGroup, FormHelperText, Grid, MenuItem, Select, TextField} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import Web3 from 'web3';
import clsx from 'clsx';
import Decimal from 'decimal.js';

import AppContext from '../../AppContext';

import FilterTabs from '../shared/FilterTabs';

import {CUSTOM_TOKENS, FIAT_CURRENCIES, TOKEN_ICONS, WITHDRAW_VIEWS} from '../../helpers/contants';
import useSmartWalletBalance from '../../hooks/useSmartWalletBalance';
import {ERROR_MESSAGES} from '../../helpers/errors';


const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  content: {
    padding: theme.spacing(2.5, 2),
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1,
    marginBottom: theme.spacing(1.25),
  },
  description: {
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: theme.spacing(2.5),
  },
  title: {
    fontSize: 16,
    lineHeight: 1.5,
    color: '#000',
    opacity: 0.6,
    marginBottom: theme.spacing(2.5),
  },
  formGroup: {
    marginBottom: theme.spacing(2),
  },
  withdrawGroup: {
    marginBottom: theme.spacing(1.25),
  },
  fiatGroup: {
    padding: theme.spacing(0.25, 1.25),
    marginBottom: theme.spacing(1.25),
    backgroundColor: '#F9F9F9',
    border: '1px solid #DCDCDC',
    borderRadius: 4,
  },
  fiatGroupWithdraw: {
    marginBottom: theme.spacing(0.5),
  },
  fiatSelect: {
    fontSize: 16,
    lineHeight: 1.5,
    '&:before': {
      borderWidth: 0,
    }
  },
  fiatCurrency: {
    fontSize: 16,
    lineHeight: 1.5,
  },
  fiatCurrencyIcon: {
    height: 20,
    marginRight: theme.spacing(1.25),
    verticalAlign: 'middle',
  },
  fiatAmount: {
    '& .MuiInput-underline:before': {
      borderWidth: 0,
    },
    '& input': {
      width: 'auto',
      display: 'inline-block',
      fontSize: 16,
      lineHeight: 1.5,
      color: '#0B0D17',
    }
  },
  infoGroup: {
    marginBottom: theme.spacing(1),
  },
  infoGroupLabel: {
    fontSize: 14,
    lineHeight: 1.5,
    color: '#000000',
  },
  infoGroupValue: {
    fontSize: 14,
    lineHeight: 1.5,
    color: '#000000',
  },
  instructions: {
    color: '#000000',
    padding: theme.spacing(1.2),
    margin: theme.spacing(2.5, 0),
    border: '1px solid #DCDCDC',
    borderRadius: 6,
    opacity: 0.6,
    '& ol': {
      marginLeft: 0,
      paddingLeft: theme.spacing(2.5),
    }
  },
  actionButton: {
    width: '100%',
  },
}));

export default () => {
  const classes = useStyles();

  const {currency, addresses, walletAddresses, networks, fiatCurrency, getSmartWalletInfo, updateFiatCurrency} = useContext(AppContext);

  const address = addresses && addresses[0] || '',
    networkId = networks && networks[0] || null,
    walletAddress = networkId && walletAddresses && walletAddresses[networkId] || null;

  const [destination, setDestination] = useState(address);
  const [destinationError, setDestinationError] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [amount, setAmount] = useState(0);
  const [amountError, setAmountError] = useState(null);
  const [tokenAmounts, setTokenAmounts] = useState({});
  const [tokenAmountErrors, setTokenAmountErrors] = useState({});
  const [fees, setFees] = useState(0);

  const FILTERS = [WITHDRAW_VIEWS.FIAT, WITHDRAW_VIEWS.CRYPTO];
  const [currentFilter, setCurrentFilter] = useState(WITHDRAW_VIEWS.FIAT);

  const walletBalance = useSmartWalletBalance(walletAddress, networkId, currency);
  const fiatBalance = walletBalance && walletBalance[FIAT_CURRENCIES.USD] || 0.00;

  useEffect(() => {
    getSmartWalletInfo();
  }, [networkId]);

  const changeDestination = address => {
    setDestination(address);
    if(address && Web3.utils.isAddress(address)) {
      setDestinationError(null);
    } else {
      setDestinationError(ERROR_MESSAGES.INVALID_WALLET_ADDRESS);
    }
  };

  const changeAmount = (amount) => {
    const cleanedAmount = (typeof amount === 'number'?amount:parseFloat(amount)) || 0;
    setAmountInput(amount);
    setAmount(cleanedAmount);
    if(cleanedAmount > fiatBalance) {
      setAmountError(ERROR_MESSAGES.AMOUNT_MORE_THAN_BALANCE);
    } else {
      setAmountError(null);
    }
  };

  const changeTokenAmounts = (token, amount) => {
    const tokenBalance = walletBalance && walletBalance.tokens && walletBalance.tokens[token] && walletBalance.tokens[token][token] || 0,
      cleanedAmount = (typeof amount === 'number'?amount:parseFloat(amount)) || 0;
    let newAmounts = {
      ...(tokenAmounts || {}),
      [token]: amount,
    };
    if(!amount) {
      delete newAmounts[token];
    }
    setTokenAmounts(newAmounts);
    if(cleanedAmount > tokenBalance) {
      setTokenAmountErrors({
        ...(tokenAmountErrors || {}),
        [token]: ERROR_MESSAGES.AMOUNT_MORE_THAN_BALANCE,
      });
    } else {
      let newErrors = {...(tokenAmountErrors || {})};
      delete newErrors[token];
      setTokenAmountErrors(newErrors);
    }
  };

  const renderAmount = amount => {
    const parts = (amount || '').toString().split('.');
    return `$${parts[0] || 0}.${parts[1] || '00'}`;
  };

  const isFiatWithdraw = currentFilter === WITHDRAW_VIEWS.FIAT;

  return (
    <div className={classes.container}>
      {/*
      <FilterTabs items={FILTERS} onChange={setCurrentFilter}/>
      */}

      <div className={classes.content}>
        <div className={classes.header}>Withdraw</div>

        <div className={classes.description}>
          {isFiatWithdraw && (
            <>Send Ethereum to any address</>
          ) || (
            <>Send tokens to another wallet</>
          )}
        </div>

        <FormGroup className={classes.formGroup}>
          <TextField label={`${isFiatWithdraw?'Ethereum':'Wallet'} Address`}
                     type="text"
                     value={destination}
                     placeholder={`${isFiatWithdraw?'Ethereum':'Wallet'} Address`}
                     required={true}
                     error={destinationError}
                     helperText={destinationError || ''}
                     onChange={e => changeDestination(e.target.value)}/>
        </FormGroup>

        {isFiatWithdraw && (
          <>
            <Grid container
                  direction="row"
                  justify="space-between"
                  alignItems="center"
                  wrap="nowrap"
                  className={classes.fiatGroup}>
              <Select
                labelId="fiat-currency"
                id="fiat-currency"
                value={fiatCurrency}
                onChange={e => updateFiatCurrency(e.target.value)}
                className={classes.fiatSelect}>
                {Object.keys(FIAT_CURRENCIES).map(key => {
                  const code = FIAT_CURRENCIES[key];
                  return (
                    <MenuItem value={code}>{code}</MenuItem>
                  );
                })}
              </Select>

              <TextField label=""
                         type="text"
                         value={amountInput}
                         placeholder="0.00"
                         required={true}
                         error={amountError}
                         onChange={e => changeAmount(e.target.value)}
                         className={classes.fiatAmount}
                         InputProps={{
                           inputProps: {
                             pattern: '^\\d+(\\.\\d{1,2})?$',
                             size: (amountInput || '').toString().length + 2
                           }}
                         }/>
            </Grid>

            {amountError && (
              <FormHelperText error={true}>{amountError}</FormHelperText>
            ) || null}

            {[
              {
                label: 'Available balance:',
                value: renderAmount(fiatBalance),
              },
              {
                label: 'Transaction fees',
                value: renderAmount(fees),
              },
              {
                label: 'New balance',
                value: renderAmount(
                  Math.max(0, fiatBalance - (amount + fees))),
              }
            ].map(({label, value}) => (
              <Grid container
                    direction="row"
                    justify="space-between"
                    alignItems="center"
                    className={classes.infoGroup}>
                <div className={classes.infoGroupLabel}>{label}</div>
                <div className={classes.infoGroupValue}>{value}</div>
              </Grid>
            ))}

            <div className={classes.instructions}>
              <p>
                Instructions. Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet sint.
              </p>
              <ol>
                <li>Velit officia consequat duis enim velit mollit.</li>
                <li>Exercitation veniam consequat sunt nostrud amet.</li>
              </ol>
              <p>Velit officia consequat duis enim velit mollit. Exercitation veniam consequat sunt nostrud amet.</p>
            </div>
          </>
        ) || (
          <>
            {[
              currency,
              ...Object.keys(CUSTOM_TOKENS).map(key => CUSTOM_TOKENS[key]),
            ].filter(Boolean).map(token => {
              const tokenBalance = walletBalance && walletBalance.tokens && walletBalance.tokens[token] && walletBalance.tokens[token][token] || 0,
                tokenAmount = tokenAmounts && tokenAmounts[token],
                tokenError = tokenAmountErrors && tokenAmountErrors[token];

              return (
                <div className={classes.withdrawGroup}>
                  <Grid container
                        direction="row"
                        justify="space-between"
                        alignItems="center"
                        wrap="nowrap"
                        className={clsx(classes.fiatGroup, classes.fiatGroupWithdraw)}>
                    <div className={classes.fiatCurrency}>
                      <img src={TOKEN_ICONS[token]} className={classes.fiatCurrencyIcon}/>{token}
                    </div>

                    <TextField label=""
                               type="text"
                               value={tokenAmount}
                               placeholder="0.00"
                               required={true}
                               error={tokenError}
                               onChange={e => changeTokenAmounts(token, e.target.value)}
                               className={classes.fiatAmount}
                               InputProps={{
                                 inputProps: {
                                   pattern: '^\\d+(\\.\\d{1,2})?$',
                                   size: (tokenAmounts && tokenAmounts[token] || '').toString().length + 2
                                 }}
                               }/>
                  </Grid>

                  {tokenError && (
                    <FormHelperText error={true}>{tokenError}</FormHelperText>
                  ) || null}

                  <Grid container
                        direction="row"
                        justify="space-between"
                        alignItems="center"
                        className={classes.infoGroup}>
                    <div className={classes.infoGroupLabel}>Available</div>
                    <div className={classes.infoGroupValue}>{new Decimal(tokenBalance || 0).toFixed(4)}</div>
                  </Grid>
                </div>
              );
            })}
          </>
        )}

        <Button variant="contained"
                color="primary"
                disabled={!destination || ((isFiatWithdraw && !amount) || (!isFiatWithdraw && !Object.keys(tokenAmounts).length))}
                className={classes.actionButton}>
          Withdraw
        </Button>
      </div>
    </div>
  );
};