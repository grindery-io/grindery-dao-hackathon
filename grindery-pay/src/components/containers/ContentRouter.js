import React, {useContext} from 'react';

import Auth from '../screens/Auth';
import Home from '../screens/Home';
import Contacts from '../screens/Contacts';
import Contracts from '../screens/Contracts';
import Payments from '../screens/Payments';
import Transactions from '../screens/Transactions';
import Wallet from '../screens/Wallet';
import Fund from '../screens/Fund';
import Withdraw from '../screens/Withdraw';
import Settings from '../screens/Settings';
import Inspector from '../screens/Inspector';

import AppContext from '../../AppContext';

import {SCREENS} from '../../helpers/contants';

export default () => {
  const {accessToken, screen} = useContext(AppContext);

  if(!accessToken) {
    return (
      <Auth/>
    );
  }
  switch (screen) {
    case SCREENS.CONTACTS: {
      return (
        <Contacts />
      );
    }
    case SCREENS.CONTRACTS: {
      return (
        <Contracts/>
      );
    }
    case SCREENS.PAYMENTS: {
      return (
        <Payments />
      );
    }
    case SCREENS.TRANSACTIONS: {
      return (
        <Transactions />
      );
    }
    case SCREENS.WALLET: {
      return (
        <Wallet />
      );
    }
    case SCREENS.FUND: {
      return (
        <Fund />
      );
    }
    case SCREENS.WITHDRAW: {
      return (
        <Withdraw />
      );
    }
    case SCREENS.SETTINGS: {
      return (
        <Settings />
      );
    }
    case SCREENS.INSPECTOR: {
      return (
        <Inspector />
      );
    }
    default: {
      return (
        <Home/>
      );
    }
  }
};