import React, {useContext, useEffect, useState} from 'react';
import {Button, LinearProgress} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import clsx from 'clsx';

import Copy from './Copy';

import AppContext from '../../AppContext';

import {makeBackgroundRequest} from '../../helpers/routines';
import {TASKS, NETWORKS} from '../../helpers/contants';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {truncateAddress} from '../../helpers/utils';

import CopyIcon from '../../images/copy.svg';


const useStyles = makeStyles((theme) => ({
  cardGroup: {
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
  networkIcon: {
    height: 18,
    marginRight: theme.spacing(0.5),
    verticalAlign: 'middle',
  },
  serviceButton: {
    width: '100%',
  },
}));

export default () => {
  const classes = useStyles();
  const {addresses, walletAddresses, networks, stableCoin, getSmartWalletInfo} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const address = addresses && addresses[0] || '',
    networkId = networks && networks[0] || null,
    walletAddress = networkId && walletAddresses && walletAddresses[networkId] || null;


  useEffect(() => {
    getSmartWalletInfo();
  }, [networkId]);

  const createWallet = () => {
    console.log('createWallet', {
      account: address,
      chain: networkId,
      smartWallets: walletAddresses,
      stableCoin: stableCoin && stableCoin.symbol || 'UST'
    });
    setLoading(true);
    makeBackgroundRequest(TASKS.CREATE_WALLET, {
      account: address,
      chain: networkId,
      smartWallets: walletAddresses,
      stableCoin: stableCoin && stableCoin.symbol || 'UST'
    }).then(hash => {

    }).catch(e => {
      setLoading(false);
      setError((e && typeof e === 'string' && e) || ERROR_MESSAGES.CREATE_WALLET_FAILED);
    });
  };

  return (
    <div className={classes.card}>
      <div className={clsx(classes.cardTitle, classes.cardWalletTitle)}>
        Smart Wallet Address
      </div>

      {walletAddress && (
        <>
          <div>{truncateAddress(walletAddress)}</div>

          <div className={classes.copyAction}>
            <Copy text={walletAddress}>
              <img src={CopyIcon}/>
            </Copy>
          </div>
        </>
      ) || (
        <div style={{textAlign: 'center', paddingTop: 8}}>
          {loading && (
            <>
              <LinearProgress/>
            </>
          ) || (
            <Button variant="contained"
                    color="primary"
                    className={classes.serviceButton}
                    onClick={createWallet}>
              Create Smart Address
            </Button>
          )}
        </div>
      )}
    </div>
  );
};