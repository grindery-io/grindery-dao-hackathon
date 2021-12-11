import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Chip} from '@material-ui/core';
import clsx from 'clsx';

import AppContext from '../../AppContext';

import {truncateAddress} from '../../helpers/utils';
import {sendContentRequest} from '../../helpers/routines';
import {ACTIONS, DIALOG_ACTIONS} from '../../helpers/contants';

import logo from '../../images/logo-round.svg';
import coinIcon from '../../images/coin.svg';
import closeIcon from '../../images/close-black.svg';


const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(1.5, 2),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: 'inset 0 -1px 0px rgba(0, 0, 0, 0.1)',
  },
  logo: {
    height: 28,
    verticalAlign: 'middle',
  },
  close: {
    width: 16,
    height: 16,
    cursor: 'pointer',
  },
  title: {
    display: 'inline-block',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1,
    marginLeft: theme.spacing(1.2),
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'center',
  },
  icon: {
    display: 'inline-block',
    height: 9,
    marginRight: theme.spacing(0.5),
  },
  network: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'center',
    padding: theme.spacing(0.5, 2.5),
    cursor: 'pointer',
    border: '1px solid #D3DEEC',
    borderRadius: 20,
  },
  address: {
    flexDirection: 'row-reverse',
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
    border: '1px solid #546076',
    paddingRight: theme.spacing(1),
    marginTop: theme.spacing(0.5),
  },
  coin: {
    display: 'inline-block',
    height: 18,
    marginLeft: theme.spacing(1.25),
    borderRadius: '100%',
  },
  clickable: {
    cursor: 'pointer',
  },
}));

export default () => {
  const classes = useStyles();
  const {accessToken, addresses, networks, logOut, getNetworkById, openDialog} = useContext(AppContext);

  const address = addresses && addresses[0] || '',
    networkId = networks && networks[0] || null,
    network = getNetworkById(networkId);

  const close = () => {
    logOut();
    sendContentRequest(ACTIONS.CLOSE).catch(() => {});
  };

  const onChangeNetwork = () => {
    openDialog(DIALOG_ACTIONS.CHANGE_NETWORK);
  };

  return (
    <div className={classes.container}>
      <div>
        <img className={classes.logo} src={logo}/>
        {!accessToken && (
          <div className={classes.title}>Grindery Pay</div>
        ) || null}
      </div>

      {accessToken && (
        <div>
          <div className={clsx(classes.network, classes.clickable)}
               onClick={onChangeNetwork}>
            {network && (network.name || network.chain) || 'Select Network'}
          </div>
          {/*address && (
            <Chip label={truncateAddress(address)}
                  size="small"
                  variant="outlined"
                  className={clsx(classes.address, classes.clickable)}
                  icon={(
                    <img className={classes.coin} src={coinIcon} height={18}/>
                  )}
                  onClick={onChangeNetwork}/>
          ) || null*/}
        </div>
      ) || null}

      <img className={classes.close} src={closeIcon} onClick={close}/>
    </div>
  );
};