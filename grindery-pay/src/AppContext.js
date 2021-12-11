import React from 'react';
import {FIAT_CURRENCIES, DEFAULT_STABLE_COINS} from './helpers/contants';

export const defaultAppState = {
  isNewUser: false,
  hidePaymentNotice: false,
  accessToken: null,
  screen: null,
  screenTab: null,
  dialog: null,
  metaQuery: null,
  addresses: [],
  walletAddresses: {},
  networks: null,
  currency: null,
  rate: 0,
  fiatCurrency: FIAT_CURRENCIES,
  stableCoin: DEFAULT_STABLE_COINS.UST_HARMONY_TEST,
  contacts: [],
  payments: [],
  transactions: [],
  integrations: [],
};

const defaultFunction = () => {};

export default React.createContext({
  ...defaultAppState,
  authenticate: defaultFunction(),

  // Actions
  logOut: defaultFunction(),
  changeScreen: defaultFunction(),
  openDialog: defaultFunction(),
  closeDialog: defaultFunction(),
  addNotification: defaultFunction(),
  updateHidePaymentNotice: defaultFunction(),
  setMetaQuery: defaultFunction(),

  // Wallet
  getWalletInfo: defaultFunction(),
  getSmartWalletInfo: defaultFunction(),
  getNetworkById: defaultFunction(),
  convertToCrypto: defaultFunction(),
  convertToPayableCrypto: defaultFunction(),
  convertPayableToDisplayValue: defaultFunction(),
  convertToFiat: defaultFunction(),
  updateFiatCurrency: defaultFunction(),
  updateStableCoin: defaultFunction(),

  // Contacts
  getContacts: defaultFunction(),
  addContact: defaultFunction(),
  addContacts: defaultFunction(),

  // Payments
  getPayments: defaultFunction(),
  addPayment: defaultFunction(),
  addPayments: defaultFunction(),

  // Transactions
  getTransactions: defaultFunction(),

  // Integrations
  getIntegrations: defaultFunction(),
  addIntegration: defaultFunction(),
  removeIntegration: defaultFunction(),

  // syncDataAndRefresh
  syncDataAndRefresh: defaultFunction(),
});
