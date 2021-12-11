import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import clsx from 'clsx';

import Dialog, {useStyles as dialogStyles} from '../containers/Dialog';

import AppContext from '../../AppContext';

import {NETWORKS, TASKS, SMART_WALLET_NETWORKS} from '../../helpers/contants';
import {makeBackgroundRequest} from '../../helpers/routines';

import checkMarkIcon from '../../images/checkmark.svg';

const useStyles = makeStyles((theme) => ({
  button: {
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: theme.spacing(1),
  },
  network: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'left',
    paddingLeft: theme.spacing(2.5),
    marginBottom: theme.spacing(1),
    cursor: 'pointer',
    color: '#0B0D17',
    opacity: 0.6,
    '&:hover, &:focus': {
      opacity: 1,
    },
  },
  networkSelected: {
    opacity: 1,
    backgroundImage: `url(${checkMarkIcon})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'left center',
  },
  networkIcon: {
    height: 18,
    marginRight: theme.spacing(0.5),
    verticalAlign: 'middle',

  },
}));

export default ({nextDialog}) => {
  const classes = useStyles();
  const dialogClasses = dialogStyles();
  const {networks, closeDialog, openDialog} = useContext(AppContext);

  const networkId = networks && networks[0] || null;

  const onClose = () => {
    if (nextDialog) {
      openDialog(nextDialog);
    } else {
      closeDialog();
    }
  };

  const onChange = chain => {
    makeBackgroundRequest(TASKS.CHANGE_NETWORK, {chain}).then(() => {
      onClose();
    }).catch(() => {
    });
  };

  return (
    <Dialog title=""
            ariaLabel="select a network"
            className={dialogClasses.dialogNarrow}
            onClose={onClose}
            closeOnOutsideClick={true}>
      {SMART_WALLET_NETWORKS.map(network => {

        return (
          <div className={clsx(classes.network, {[classes.networkSelected]: network.chainId === networkId})}
               onClick={() => onChange(network.chainId)}>
            <img src={network.icon} className={classes.networkIcon}/>
            {network.name}
          </div>
        );
      })}
    </Dialog>
  );
};