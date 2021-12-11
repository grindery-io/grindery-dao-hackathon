import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Button, Grid} from '@material-ui/core';

import SmartWallet from '../shared/SmartWallet';

import AppContext from '../../AppContext';

import {DEFAULT_STABLE_COINS, TOKEN_ICONS, NETWORKS} from '../../helpers/contants';


import USTIcon from '../../images/UST.svg';
import ETHIcon from '../../images/ETH.svg';
import SwapArrowRightIcon from '../../images/swap-arrow-right.svg';
import FundIcon from '../../images/fund-white.svg';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  content: {
    padding: theme.spacing(2.5, 2),
    borderBottom: '1px solid #D3DEEC',
    '&:last-child': {
      borderWidth: 0,
    },
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1,
    margin: theme.spacing(0.5, 0, 1.25, 0),
  },
  description: {
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: theme.spacing(2.5),
  },
  card: {
    position: 'relative',
    border: '1px solid #D3DEEC',
    borderRadius: 10,
    padding: theme.spacing(2.5),
    marginBottom: theme.spacing(2.5),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 1.5,
    color: '#000',
    opacity: 0.6,
    marginBottom: theme.spacing(1),
  },
  cardWalletTitle: {
    marginBottom: theme.spacing(0.625),
  },
  copyAction: {
    position: 'absolute',
    top: theme.spacing(2.5),
    right: theme.spacing(2.5),
    cursor: 'pointer',
  },
  currencyIcon: {
    width: 24,
    marginRight: theme.spacing(1),
  },
  swapIcon: {
    width: 14,
    margin: theme.spacing(0, 0.5),
  },
  swapGroup: {
    marginBottom: theme.spacing(2.5),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  swapItem: {
    width: 'auto',
    maxWidth: `calc(50% - ${(14 + theme.spacing(0.5) * 2)/2}px)`,
  },
  swapTokenSymbol: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  swapTokenName: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#898989',
  },
  serviceGroup: {
    padding: theme.spacing(2.5, 0),
    borderBottom: '1px solid #D3DEEC',
    '&:first-child': {
      paddingTop: 0,
    },
    '&:last-child': {
      borderWidth: 0,
    }
  },
  serviceTitle: {
    fontSize: 14,
    lineHeight: 1,
    fontWeight: 700,
    color: '#0B0D17',
    marginBottom: theme.spacing(1.25),
  },
  serviceDescription: {
    fontSize: 14,
    lineHeight: 1.5,
    fontWeight: 400,
    color: '#000000',
    marginBottom: theme.spacing(2.5),
    opacity: 0.6,
  },
  serviceButton: {
    width: '100%',
  },
  serviceIcon: {
    display: 'inline-block',
    height: 12,
    marginRight: theme.spacing(0.5),
    verticalAlign: 'middle',
  }
}));

export default () => {
  const classes = useStyles();
  const {networks, currency, stableCoin, walletAddresses, getNetworkById} = useContext(AppContext);

  const networkId = networks && networks[0] || null,
    network = getNetworkById(networkId),
    nativeTokenSymbol = currency || 'ETH',
    nativeTokenName = network && network.nativeCurrency.name || 'Ethereum',
    nativeTokenIcon = TOKEN_ICONS[currency] || ETHIcon,
    stableCoinSymbol = (stableCoin && stableCoin.symbol) || DEFAULT_STABLE_COINS.UST_HARMONY_TEST.symbol,
    stableCoinName = (stableCoin && stableCoin.name) || DEFAULT_STABLE_COINS.UST_HARMONY_TEST.name,
    stableCoinIcon = (stableCoin && stableCoin.symbol && TOKEN_ICONS[stableCoin.symbol]) || USTIcon;

  const ethSmartWalletAddress = walletAddresses && walletAddresses[NETWORKS.ETHEREUM.chainId] || null;

  return (
    <div className={classes.container}>
      <div className={classes.content}>
        <div className={classes.header}>Add Funds</div>

        <div className={classes.description}>
          Add {nativeTokenSymbol} to corresponding smart wallet address to autoswap to {stableCoinName}.
          {currency === 'ETH'?`You can use Wyre, Transak to buy ${nativeTokenSymbol}.`:''}
        </div>

        <SmartWallet/>

        <div className={classes.card}>
          <div className={classes.cardTitle}>Autoswap</div>

          <Grid container
                direction="row"
                justify="space-between"
                alignItems="center"
                className={classes.swapGroup}>
            <Grid container
                  direction="row"
                  justify="space-between"
                  alignItems="center"
                  wrap="nowrap">

              <Grid container
                    direction="row"
                    justify="flex-start"
                    alignItems="center"
                    wrap="nowrap"
                    className={classes.swapItem}>
                <img src={nativeTokenIcon} className={classes.currencyIcon}/>
                <div>
                  <div className={classes.swapTokenSymbol}>{nativeTokenSymbol}</div>
                  <div className={classes.swapTokenName}>{nativeTokenName}</div>
                </div>
              </Grid>

              <img src={SwapArrowRightIcon} className={classes.swapIcon}/>

              <Grid container
                    direction="row"
                    justify="flex-start"
                    alignItems="center"
                    wrap="nowrap"
                    className={classes.swapItem}>
                <img src={stableCoinIcon} className={classes.currencyIcon}/>
                <div>
                  <div className={classes.swapTokenSymbol}>{stableCoinSymbol}</div>
                  <div className={classes.swapTokenName}>{stableCoinName}</div>
                </div>
              </Grid>
            </Grid>
          </Grid>
        </div>
      </div>

      <div className={classes.content}>
        {[
          {
            title: 'Fund with Wyre',
            description: `Wyre lets you use a debit card to deposit ETH right into you Grindery Pay account.`,
            action: 'Continue to Wyre',
            url: `https://pay.sendwyre.com/purchase?destCurrency=ETH${ethSmartWalletAddress?`&dest=ethereum:${ethSmartWalletAddress}`:''}`,
          },
          {
            title: 'Fund with Transak',
            description: `Transak supports debit card and bank transfers (depending on location) in 59+ countries. ${currency} deposits into your Grindery Pay account.`,
            action: 'Continue to Transak',
            url: 'https://transak.com/',
          },
          /*
          {
            title: 'Deposit Ether immediately',
            description: `If you already own ${currency}, instant deposit is the fastest way to get Ether into your Grindery Pay wallet.`,
            action: 'View Account'
          }
          */
        ].map(({title, description, action, url}) => (
          <div className={classes.serviceGroup}>
            <div className={classes.serviceTitle}>{title}</div>
            <div className={classes.serviceDescription}>{description}</div>

            <Button variant="contained"
                    color="primary"
                    className={classes.serviceButton}
                    {...url?{
                      href: url,
                      target: '_blank',
                    }:{}}
                    startIcon={
                      <img src={FundIcon} className={classes.serviceIcon}/>
                    }>
              {action}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};