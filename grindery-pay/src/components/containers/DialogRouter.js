import React, {useContext} from 'react';

import AddContact from '../dialogs/AddContact';
import AddPayment from '../dialogs/AddPayment';
import MakePayout from '../dialogs/MakePayout';
import ConnectGoogleSheet from '../dialogs/ConnectGoogleSheet';
import TransactionDetails from '../dialogs/TransactionDetails';
import ChangeNetwork from '../dialogs/ChangeNetwork';

import AppContext from '../../AppContext';

import {DIALOG_ACTIONS} from '../../helpers/contants';

export default () => {
  const {accessToken, dialog} = useContext(AppContext);
  const {action, data} = dialog || {};

  if(!accessToken) {
    return null;
  }
  switch (action) {
    case DIALOG_ACTIONS.ADD_CONTACT: {
      return (
        <AddContact {...data}/>
      );
    }
    case DIALOG_ACTIONS.ADD_PAYMENT: {
      return (
        <AddPayment {...data}/>
      );
    }
    case DIALOG_ACTIONS.MAKE_PAYOUT: {
      return (
        <MakePayout {...data}/>
      );
    }
    case DIALOG_ACTIONS.CONNECT_GOOGLE_SHEET: {
      return (
        <ConnectGoogleSheet {...data}/>
      );
    }
    case DIALOG_ACTIONS.SHOW_TRANSACTION_DETAILS: {
      return (
        <TransactionDetails {...data}/>
      );
    }
    case DIALOG_ACTIONS.CHANGE_NETWORK: {
      return (
        <ChangeNetwork {...data}/>
      );
    }
    default: {
      return null;
    }
  }
};