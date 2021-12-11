import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Grid} from '@material-ui/core';
import Decimal from 'decimal.js';

import SmartWallet from '../shared/SmartWallet';

import AppContext from '../../AppContext';
import useSmartWalletBalance from '../../hooks/useSmartWalletBalance';

import {FIAT_CURRENCIES, CUSTOM_TOKENS, TOKEN_ICONS, NATIVE_TOKENS} from '../../helpers/contants';

import ETHIcon from '../../images/ETH.svg';


const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1,
    margin: theme.spacing(0.5, 0, 1.25, 0),
  },
  fiatSelectContainer: {
    textAlign: 'right',
    marginBottom: theme.spacing(2.75),
  },
  fiatSelect: {
    fontSize: 16,
    lineHeight: 1.5,
    '&:before': {
      borderWidth: 0,
    }
  },
  card: {
    border: '1px solid #D3DEEC',
    borderRadius: 10,
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(2.5),
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 1.5,
    color: '#000',
    marginBottom: theme.spacing(2.5),
    opacity: 0.6,
  },
  cardAmount: {
    fontSize: 30,
    fontWeight: 300,
    textAlign: 'right',
    lineHeight: 1,
    color: '#0B0D17',
  },
  cardAmountLight: {
    opacity: 0.2,
  },
  tokenGroup: {
    padding: theme.spacing(2.5, 0),
    borderBottom: '1px solid #D3DEEC',
    '&:first-child': {
      paddingTop: theme.spacing(1.25),
    },
    '&:last-child': {
      marginBottom: 0,
      borderWidth: 0,
    },
  },
  tokenGroupTitle: {
    fontSize: 16,
    lineHeight: 1.5,
    color: '#000000',
    marginBottom: theme.spacing(1.25),
    opacity: 0.6,
  },
  tokenContainer: {
    marginBottom: theme.spacing(2.5),
    '&:last-child': {
      marginBottom: 0,
    }
  },
  tokenIcon: {
    height: 25,
    marginRight: theme.spacing(1),
  },
  tokenSymbol: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  tokenName: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#898989',
  },
  tokenAmount: {
    fontSize: 14,
    lineHeight: 1.14,
    fontWeight: 'bold',
  },
}));

export default () => {
  const classes = useStyles();
  const {currency, walletAddresses, networks, getNetworkById} = useContext(AppContext);

  const networkId = networks && networks[0] || null,
    walletAddress = networkId && walletAddresses && walletAddresses[networkId] || null,
    network = getNetworkById(networkId),
    nativeTokenSymbol = currency || NATIVE_TOKENS.ETH,
    nativeTokenName = network && network.nativeCurrency.name || 'Ethereum',
    nativeTokenIcon = TOKEN_ICONS[currency] || ETHIcon;

  const balance = useSmartWalletBalance(walletAddress, networkId, currency);

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
      {/*
      <div className={classes.header}>Wallet</div>

      <div className={classes.fiatSelectContainer}>
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
      </div>
      */}

      <SmartWallet/>

      <div className={classes.card}>
        <div className={classes.cardTitle}>Aggregated wallet balance</div>

        <div className={classes.cardAmount}>
          {renderAmount(balance && balance[FIAT_CURRENCIES.USD] || 0.00)}
        </div>
      </div>

      <div>
        {[
          {
            title: 'Stable coins',
            tokens: [
              {
                symbol: CUSTOM_TOKENS.UST,
                name: 'TerraUSD',
                icon: TOKEN_ICONS[CUSTOM_TOKENS.UST],
              },
              {
                symbol: CUSTOM_TOKENS.BUSD,
                name: 'Binance USD',
                icon: TOKEN_ICONS[CUSTOM_TOKENS.BUSD],
              },
              /*
              {
                symbol: CUSTOM_TOKENS.USDC,
                name: 'USD Coin',
                icon: TOKEN_ICONS[CUSTOM_TOKENS.USDC],
              },
              {
                symbol: CUSTOM_TOKENS.DAI,
                name: 'DAI',
                icon: TOKEN_ICONS[CUSTOM_TOKENS.DAI],
              },
              {
                symbol: CUSTOM_TOKENS.USDT,
                name: 'Tether USD',
                icon: TOKEN_ICONS[CUSTOM_TOKENS.USDT],
              },
              */
            ]
          },
          {
            title: 'Other coins',
            tokens: [
              {
                symbol: nativeTokenSymbol,
                name: nativeTokenName,
                icon: nativeTokenIcon,
              },
              /*
              {
                symbol: NATIVE_TOKENS.ONE,
                name: 'ONE',
                icon: TOKEN_ICONS[NATIVE_TOKENS.ONE],
              },
              {
                symbol: NATIVE_TOKENS.ETH,
                name: 'ETH',
                icon: TOKEN_ICONS[NATIVE_TOKENS.ETH],
              },
              {
                symbol: CUSTOM_TOKENS.LINK,
                name: 'Chainlink',
                icon: TOKEN_ICONS[CUSTOM_TOKENS.LINK],
              },
              */
            ]
          }
        ].map(({title, tokens}, idx) => (
          <div className={classes.tokenGroup}>
            <div className={classes.tokenGroupTitle}>{title}</div>
            {(tokens || []).map(({symbol, icon, name}) => {
              return (
                <Grid container
                      direction="row"
                      justify="space-between"
                      alignItems="center"
                      className={classes.tokenContainer}>
                  <Grid container
                        direction="row"
                        justify="space-between"
                        alignItems="center">

                    <Grid container
                          direction="row"
                          justify="flex-start"
                          alignItems="center"
                          style={{width: 'auto'}}>
                      <img src={icon} className={classes.tokenIcon}/>
                      <div>
                        <div className={classes.tokenSymbol}>{symbol}</div>
                        <div className={classes.tokenName}>{name}</div>
                      </div>
                    </Grid>

                    <div className={classes.tokenAmount}>
                      {new Decimal(balance && balance.tokens && balance.tokens[symbol] && balance.tokens[symbol][symbol] || 0).toFixed(idx === 0?2:4)}
                    </div>
                  </Grid>
                </Grid>
              );
            })}
          </div>
        ))}
      </div>

    </div>
  );
};