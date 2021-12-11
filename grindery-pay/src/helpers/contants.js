import Web3 from 'web3';

import homeIcon from '../images/home.svg';
import homeIconLight from '../images/home-light.svg';
import contactsIcon from '../images/contacts.svg';
import contactsLightIcon from '../images/contacts-light.svg';
import paymentsIcon from '../images/payments.svg';
import paymentsLightIcon from '../images/payments-light.svg';
import contractsIcon from '../images/contracts.svg';
import contractsLightIcon from '../images/contracts-light.svg';
import transactionsIcon from '../images/list.svg';
import transactionsLightIcon from '../images/list-light.svg';
import walletIcon from '../images/wallet.svg';
import walletLightIcon from '../images/wallet-light.svg';
import fundIcon from '../images/fund.svg';
import fundLightIcon from '../images/fund-light.svg';
import withdrawIcon from '../images/withdraw.svg';
import withdrawLightIcon from '../images/withdraw-light.svg';
import settingsIcon from '../images/settings.svg';
import settingsLightIcon from '../images/settings-light.svg';
import inspectorIcon from '../images/inspector.svg';
import inspectorLightIcon from '../images/inspector-light.svg';

import gustoLogo from '../images/gusto.svg';
import googleSheetsLogo from '../images/google-sheets.svg';
import circleLogo from '../images/circle.svg';

import ETHIcon from '../images/ETH.svg';
import ONEIcon from '../images/ONE.svg';
import USTIcon from '../images/UST.svg';
import BUSDIcon from '../images/BUSD.svg';
import USDCIcon from '../images/USDC.svg';
import LINKIcon from '../images/LINK.svg';
import USDTIcon from '../images/USDT.svg';
import DAIIcon from '../images/DAI.svg';

export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const ADDRESS_EXAMPLE = '0xab5801a7d398351b8be11c439e05c5b3259aec9a';

export const EXTENSION_SELECTOR_NAME = 'grindery-payroll-extension-root';
export const EXTENSION_META_BUTTON_SELECTOR_NAME = 'grindery-pay-extension-meta-button';

export const MESSAGE_TYPES = {
  TASK: 'task',
  NOTIFICATION: 'notification',
  ACTION: 'action',
  EVENT: 'event',
};

export const TASKS = {
  REQUEST_ACCOUNTS: 'request_accounts',
  GET_ACCOUNTS: 'get_accounts',
  GET_NETWORK: 'get_network',
  LISTEN_FOR_WALLET_EVENTS: 'listen_for_wallet_events',
  GET_BALANCE: 'get_balance',
  MAKE_PAYOUT: 'make_payout',
  CLEAN_TRANSACTIONS: 'clean_transactions',
  SYNC_EXTERNAL_DATA: 'sync_external_data',
  CREATE_WALLET: 'create_wallet',
  CHANGE_NETWORK: 'change_network',
  GET_TOKEN_BALANCE: 'get_token_balance',
  OPEN_META_POPUP: 'open_meta_popup',
  RELAY_META_EVENT: 'relay_meta_event',
};

export const NOTIFICATIONS = {
  PAYOUT_INITIATED: 'payout_initiated',
  PAYOUT_COMPLETED: 'payout_completed',
  PAYOUT_FAILED: 'payout_failed',
  CREATE_WALLET_INITIATED: 'create_wallet_initiated',
  CREATE_WALLET_COMPLETED: 'create_wallet_completed',
  CREATE_WALLET_FAILED: 'create_wallet_failed',
};

export const ACTIONS = {
  CLOSE: 'close',
  GET_ACTIVE_GOOGLE_SHEET_INFO: 'get_active_google_sheet_info',
  GET_ACTIVE_ARAGON_DAO_INFO: 'get_active_aragon_dao_info',
  GET_ACTIVE_GNOSIS_SAFE_INFO: 'get_active_gnosis_safe_info',

  ADD_META: 'add_meta',
  OPEN_META_POPUP: 'open_meta_popup',
  TOGGLE_META_POPUP: 'toggle_meta_popup',
};

export const SCREENS = {
  AUTH: 'auth',
  HOME: 'home',
  CONTACTS: 'contacts',
  PAYMENTS: 'payments',
  CONTRACTS: 'contracts',
  TRANSACTIONS: 'transactions',
  WALLET: 'wallet',
  FUND: 'fund',
  WITHDRAW: 'withdraw',
  SETTINGS: 'settings',
  INSPECTOR: 'inspector',
};

export const SCREEN_DETAILS = {
  [SCREENS.HOME]: {
    title: 'Dashboard',
    icon: {
      main: homeIcon,
      light: homeIconLight,
    }
  },
  [SCREENS.CONTACTS]: {
    title: 'Contacts',
    icon: {
      main: contactsIcon,
      light: contactsLightIcon,
    }
  },
  [SCREENS.PAYMENTS]: {
    title: 'Payments',
    icon: {
      main: paymentsIcon,
      light: paymentsLightIcon,
    }
  },
  [SCREENS.CONTRACTS]: {
    title: 'Contracts',
    icon: {
      main: contractsIcon,
      light: contractsLightIcon,
    }
  },
  [SCREENS.TRANSACTIONS]: {
    title: 'Transactions',
    icon: {
      main: transactionsIcon,
      light: transactionsLightIcon,
    }
  },
  [SCREENS.WALLET]: {
    title: 'Smart Wallet',
    icon: {
      main: walletIcon,
      light: walletLightIcon,
    }
  },
  [SCREENS.FUND]: {
    title: 'Funding',
    icon: {
      main: fundIcon,
      light: fundLightIcon,
    }
  },
  [SCREENS.WITHDRAW]: {
    title: 'Withdraw',
    icon: {
      main: withdrawIcon,
      light: withdrawLightIcon,
    }
  },
  [SCREENS.SETTINGS]: {
    title: 'General Settings',
    tooltip: 'Settings',
    icon: {
      main: settingsIcon,
      light: settingsLightIcon,
    }
  },
  [SCREENS.INSPECTOR]: {
    title: 'Inspector',
    icon: {
      main: inspectorIcon,
      light: inspectorLightIcon,
    }
  },
};

export const HIDDEN_SCREENS = [
  SCREENS.CONTRACTS
];

export const DISABLED_SCREENS = [
  SCREENS.WALLET,
  SCREENS.WITHDRAW,
  SCREENS.FUND,
];

export const DIALOG_ACTIONS = {
  ADD_CONTACT: 'add_contact',
  ADD_PAYMENT: 'add_payment',
  MAKE_PAYOUT: 'make_payout',
  CONNECT_GOOGLE_SHEET: 'connect_google_sheet',
  SHOW_TRANSACTION_DETAILS: 'show_transaction_details',
  CHANGE_NETWORK: 'change_network',
};

export const PAYMENT_TYPES = {
  ONE_TIME: 'one_time',
  WEEKLY: 'weekly',
  BI_WEEKLY: 'bi_weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUAL: 'annual',
};

export const PAYMENT_TYPES_DISPLAY = {
  [PAYMENT_TYPES.ONE_TIME]: 'One Time',
  [PAYMENT_TYPES.WEEKLY]: 'Weekly',
  [PAYMENT_TYPES.BI_WEEKLY]: 'Bi-Weekly',
  [PAYMENT_TYPES.MONTHLY]: 'Monthly',
  [PAYMENT_TYPES.QUARTERLY]: 'Quarterly',
  [PAYMENT_TYPES.ANNUAL]: 'Annual',
};

export const INTEGRATIONS = {
  GUSTO: 'gusto',
  GOOGLE_SHEETS: 'google_sheets',
  CIRCLE: 'circle',
};

export const INTEGRATION_DETAILS = {
  [INTEGRATIONS.GOOGLE_SHEETS]: {
    logo: googleSheetsLogo,
  },
  [INTEGRATIONS.CIRCLE]: {
    logo: circleLogo,
  },
  [INTEGRATIONS.GUSTO]: {
    logo: gustoLogo,
  },
};

export const HIDDEN_INTEGRATIONS = [
  INTEGRATIONS.CIRCLE,
  INTEGRATIONS.GUSTO,
];

export const DISABLED_INTEGRATIONS = [

];

export const SPREADSHEET_COLUMNS = {
  NAME: 'name',
  EMAIL: 'email',
  ADDRESS: 'address',

  RECIPIENT: 'recipient',
  CURRENCY: 'currency',
  AMOUNT: 'amount',
  DUE_DATE: 'due_date',
  DETAILS: 'details',
};

export const SPREADSHEET_COLUMNS_DISPLAY = {
  [SPREADSHEET_COLUMNS.NAME]: 'Name',
  [SPREADSHEET_COLUMNS.EMAIL]: 'Email',
  [SPREADSHEET_COLUMNS.ADDRESS]: 'Wallet Address',

  [SPREADSHEET_COLUMNS.RECIPIENT]: 'Recipient',
  [SPREADSHEET_COLUMNS.CURRENCY]: 'Currency',
  [SPREADSHEET_COLUMNS.AMOUNT]: 'Amount',
  [SPREADSHEET_COLUMNS.DUE_DATE]: 'Due Date',
  [SPREADSHEET_COLUMNS.DETAILS]: 'Details',
};

export const CONTRACT_VIEWS = {
  ALL: 'All',
  RECEIVED: 'Received',
  SENT: 'Sent'
};

export const PAYMENT_VIEWS = {
  ALL: 'All',
  DUE: 'Due',
  DUE_TODAY: 'Due Today',
  DUE_SOON: 'Due Soon',
  OVERDUE: 'Overdue',
  IN_PROGRESS: 'In Progress',
};

export const PAYMENT_DUE_STATES = {
  DUE_TODAY: 'due_today',
  DUE_SOON: 'due_soon',
  OVERDUE: 'overdue',
}

export const TRANSACTION_VIEWS = {
  ALL: 'All',
  RECEIVED: 'Received',
  SENT: 'Sent',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
};

export const TRANSACTION_DIRECTIONS = {
  IN: 'in',
  OUT: 'out',
};

export const WALLET_EVENTS = {
  ACCOUNTS_CHANGED: 'accountsChanged',
  CHAIN_CHANGED: 'chainChanged',
  MESSAGE: 'message',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
};

export const WITHDRAW_VIEWS = {
  FIAT: 'FIAT',
  CRYPTO: 'CRYPTO',
};

export const FIAT_CURRENCIES = {
  USD: 'USD',
  //EUR: 'EUR',
};

export const NATIVE_TOKENS = {
  ETH: 'ETH',
  ONE: 'ONE',
};

export const CUSTOM_TOKENS = {
  UST: 'UST',
  BUSD: 'BUSD',
  //USDC: 'USDC',
  //DAI: 'DAI',
  //USDT: 'USDT',
  //LINK: 'LINK',
};

export const DEFAULT_STABLE_COINS = {
  UST_HARMONY_TEST: {
    symbol: CUSTOM_TOKENS.UST,
    name: 'UST-Harmony Testnet',
    chainId: 1666700000,
    icon: USTIcon,
  },
  BUSD_HARMONY_TEST: {
    symbol: CUSTOM_TOKENS.BUSD,
    name: 'BUSD-Harmony Testnet',
    chainId: 1666700000,
    icon: BUSDIcon,
  },
  /*
  UST_HARMONY: {
    symbol: 'UST',
    name: 'UST-Harmony',
    chainId: 1666600000
  },
  BUSD_HARMONY: {
    symbol: 'BUSD',
    name: 'BUSD-Harmony',
    chainId: 1666600000
  },
  */
};

export const TOKEN_ICONS = {
  [NATIVE_TOKENS.ETH]: ETHIcon,
  [NATIVE_TOKENS.ONE]: ONEIcon,
  [CUSTOM_TOKENS.UST]: USTIcon,
  [CUSTOM_TOKENS.BUSD]: BUSDIcon,
  //[CUSTOM_TOKENS.USDC]: USDCIcon,
  //[CUSTOM_TOKENS.USDT]: USDTIcon,
  //[CUSTOM_TOKENS.DAI]: DAIIcon,
  //[CUSTOM_TOKENS.LINK]: LINKIcon,
};

export const NETWORKS = {
  ETHEREUM: {
    icon: ETHIcon,
    name: 'Ethereum',
    chainId: 1,
  },
  HARMONY: {
    icon: ONEIcon,
    name: 'Harmony',
    chainId: 1666600000,
  },
  HARMONY_TESTNET: {
    icon: ONEIcon,
    name: 'Harmony Testnet',
    chainId: 1666700000,
  },
  ROPSTEN: {
    icon: ETHIcon,
    name: 'Ropsten Testnet',
    chainId: 3,
  },
  RINKEBY: {
    icon: ETHIcon,
    name: 'Rinkeby Testnet',
    chainId: 4,
  },
  GOERLI: {
    icon: ETHIcon,
    name: 'Goerli Testnet',
    chainId: 5,
  },
  KOVAN: {
    icon: ETHIcon,
    name: 'Kovan Testnet',
    chainId: 42,
  },
};

export const SMART_WALLET_NETWORKS = [
  NETWORKS.RINKEBY,
  NETWORKS.HARMONY_TESTNET,
  NETWORKS.KOVAN,
  NETWORKS.ROPSTEN,
];

export const PAYMENT_OPTIONS = {
  DEFAULT: 'default',
  SMART_WALLET: 'smart-wallet',
  DELEGATED_TRANSFER: 'delegated-transfer',
  ARAGON: 'aragon',
  GNOSIS: 'gnosis',
  // Legacy
  SMART: 'smart', // smart wallet
  DAO: 'dao', // delegated transfer
};

export const LEGACY_AND_DISABLED_PAYMENT_OPTIONS = [
  // Disabled
  PAYMENT_OPTIONS.SMART_WALLET,
  // Legacy
  PAYMENT_OPTIONS.SMART,
  PAYMENT_OPTIONS.DAO
];

export const PAYMENT_OPTIONS_LABELS = {
  [PAYMENT_OPTIONS.DEFAULT]: 'Metamask Wallet',
  [PAYMENT_OPTIONS.SMART_WALLET]: 'Grindery Wallet',
  [PAYMENT_OPTIONS.DELEGATED_TRANSFER]: 'Smart Contract Address',
  [PAYMENT_OPTIONS.ARAGON]: 'Aragon DAO',
  [PAYMENT_OPTIONS.GNOSIS]: 'Gnosis Safe',
  // Legacy
  [PAYMENT_OPTIONS.SMART]: 'Grindery Wallet',
  [PAYMENT_OPTIONS.DAO]: 'Smart Contract Address',
};

export const PAYMENT_OPTIONS_DESCRIPTION = {
  [PAYMENT_OPTIONS.DEFAULT]: 'Use your current balance of {balance}',
  [PAYMENT_OPTIONS.SMART_WALLET]: 'Use your current balance of {balance} to pay',
  [PAYMENT_OPTIONS.DELEGATED_TRANSFER]: 'Send {amount} from any Wallet or DAO to a unique smart contract address',
  [PAYMENT_OPTIONS.ARAGON]: 'Fill in the DAO name or address to create a withdrawal transaction in the DAO',
  [PAYMENT_OPTIONS.GNOSIS]: 'Fill in the Gnosis Safe address to create a withdrawal transaction in the safe',
};

export const EVENT_NAMES = {
  BATCH_TRANSFER_REQUESTED: 'BatchTransferRequested',
  BATCH_TRANSFER: 'BatchTransfer',
  RECEIVED: 'Received',
};

export const EVENT_SIGNATURES = {
  BATCH_TRANSFER_REQUESTED: Web3.utils.sha3('BatchTransferRequested(address,address[],uint256[],address[])'),
  BATCH_TRANSFER: Web3.utils.sha3('BatchTransfer(address,address[],uint256[],address[])'),
  RECEIVED: Web3.utils.sha3('Received(address,uint256)'),
};

export const ARAGON_APP_ENS_SUFFIX = '.aragonid.eth';
export const ARAGON_PM_ENS_SUFFIX = '.aragonpm.eth';

export const ARAGON_FUNCTION_SIGNATURES = {
  NEW_IMMEDIATE_PAYMENT: 'newImmediatePayment(address,address,uint256,string)',
  FORWARD: 'forward(bytes)',
};

export const ARAGON_EVENT_SIGNATURES = {
  SET_APP: Web3.utils.sha3('SetApp(bytes32,bytes32,address)'),
  NEW_APP_PROXY: Web3.utils.sha3('NewAppProxy(address,bool,bytes32)'),
};

export const ARAGON_APP_NAME = {
  AGENT: 'agent',
  FINANCE: 'finance',
  FUNDRAISING: 'aragon-fundraising',
  SURVEY: 'survey',
  TOKEN_MANAGER: 'token-manager',
  VAULT: 'vault',
  VOTING: 'voting',
};

export const GNOSIS_OPERATIONS = {
  CALL: 0,
  DELEGATE: 1,
  CREATE: 2,
};

export const HEX_PREFIX = '0x';

export const EMPTY_HEX_DATA = HEX_PREFIX;

export const MODELS = {
  CONTACTS: 'contacts',
  PAYMENT_REQUESTS: 'payment_requests',
};

export const META_TRIGGERS = {
  ACTIVATED: 'activated',
  UPDATED: 'updated',
};

export const META_EVENTS = {
  QUERY: 'query',
};

export const IPFS_URL = 'https://ipfs.infura.io:5001/api/v0';

export const GRINDERY_INDEX_URL = 'https://grindery-index.herokuapp.com/api/v0';