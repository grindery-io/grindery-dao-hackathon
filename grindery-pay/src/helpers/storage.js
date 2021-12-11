/*global chrome*/

import _ from 'lodash';
import Web3 from 'web3';
import {deduplicatePayments} from "./utils";

export const STORAGE_KEYS = {
  LAST_ACTIVITY_AT: 'last_activity_at',
  HIDE_PRE_PAYMENT_NOTICE: 'hide_pre_payment_notice',
  SNAPSHOT: 'snapshot',
  HASH: 'hash',
  ADDRESSES: 'addresses',
  NETWORKS: 'networks',
  CONTACTS: 'contacts',
  PAYMENTS: 'payments',
  TRANSACTIONS: 'transactions',
  BALANCE: 'balance',
  INTEGRATIONS: 'integrations',
  WALLET_ADDRESSES: 'wallet_addresses',
  FIAT_CURRENCY: 'fiat_currency',
  STABLE_COIN: 'stable_coin',
  ADVANCED_MODE: 'advanced_mode',
};

const canFallbackToStorage = typeof chrome.storage === 'undefined';

/* Core Utilities */
export const readFromStorage = (key) => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([key], function(result) {
        let value = result[key];
        if(value) {
          value = JSON.parse(value);
        }
        resolve(value);
      });
    } catch (e) {
      if(canFallbackToStorage) {
        let value = localStorage.getItem(key);
        if(value) {
          try {
            value = JSON.parse(value);
          } catch (e) {
          }
        }
        resolve(value);
      } else {
        reject(e);
      }
    }
  });
};

export const writeToStorage = (key, value) => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({[key]: JSON.stringify(value)}, function() {
        resolve(null);
      });
    } catch (e) {
      if(canFallbackToStorage) {
        localStorage.setItem(key, JSON.stringify(value));
        resolve(null);
      } else {
        //console.error('storage error => ', e);
        reject(e);
      }
    }
  });
};

/* Data Type Utilities */
export const updateMap = (key, data) => {
  return readFromStorage(key).then(existingData => {
    const updatedData = {...(data || {}), ...(existingData || {})};
    return writeToStorage(key, updatedData).then(res => {
      return updatedData;
    }).catch(e => {
      throw e;
    });
  }).catch(e => {
    throw e;
  });
};

export const getArray = key => {
  return readFromStorage(key).then(res => {
    return res && Array.isArray(res) ? res : [];
  }).catch(e => {
    throw e;
  });
};

export const addItemsToArray = (key, items, deduplicator=null) => {
  return getArray(key).then(existingItems => {
    let updatedItems = [...(items || []), ...(existingItems || [])].filter(i => i);
    if(deduplicator && typeof deduplicator === 'function') {
      updatedItems = deduplicator(updatedItems);
    }
    return writeToStorage(key, updatedItems).then(res => {
      return updatedItems;
    }).catch(e => {
      throw e;
    });
  }).catch(e => {
    throw e;
  });
};

export const addItemToArray = (key, item, deduplicator=null) => {
  return addItemsToArray(key, [item], deduplicator);
}

/* High Level Utilities */
/* Hash */
export const getHash = () => {
  return readFromStorage(STORAGE_KEYS.HASH).then(res => {
    return res || null;
  }).catch(e => {
    throw e;
  });
};

export const saveHash = data => {
  return writeToStorage(STORAGE_KEYS.HASH, data).then(res => {
    return data;
  }).catch(e => {
    throw e;
  });
};

/* Hide Pre Payment Notice */
export const getHidePrePaymentNotice = () => {
  return readFromStorage(STORAGE_KEYS.HIDE_PRE_PAYMENT_NOTICE).then(res => {
    return res === 'true';
  }).catch(e => {
    throw e;
  });
};

export const setHidePrePaymentNotice = () => {
  return writeToStorage(STORAGE_KEYS.HIDE_PRE_PAYMENT_NOTICE, 'true').then(res => {
    return null;
  }).catch(e => {
    throw e;
  });
};

/* Advanced Mode */
export const getAdvancedMode = () => {
  return readFromStorage(STORAGE_KEYS.ADVANCED_MODE).then(res => {
    return res === 'true';
  }).catch(e => {
    throw e;
  });
};

export const saveAdvancedMode = (mode) => {
  return writeToStorage(STORAGE_KEYS.ADVANCED_MODE, mode?'true':'false').then(res => {
    return null;
  }).catch(e => {
    throw e;
  });
};

/* Snapshot */
export const getSnapshot = () => {
  return readFromStorage(STORAGE_KEYS.SNAPSHOT).then(res => {
    return res && typeof res === 'object'? res : null;
  }).catch(e => {
    throw e;
  });
};

export const saveSnapshot = data => {
  const snapshot = typeof data === 'object'?data:'';
  return writeToStorage(STORAGE_KEYS.SNAPSHOT, snapshot).then(res => {
    return snapshot || null;
  }).catch(e => {
    throw e;
  });
};

export const clearSnapshot = () => {
  return writeToStorage(STORAGE_KEYS.SNAPSHOT, '').then(res => {
    return null;
  }).catch(e => {
    throw e;
  });
};

/* Addresses */
export const getAddresses = () => {
  return getArray(STORAGE_KEYS.ADDRESSES);
};

export const saveAddress = data => {
  return addItemToArray(STORAGE_KEYS.ADDRESSES, data, items => _.uniq(items || []));
};

export const saveAddresses = data => {
  return addItemsToArray(
    STORAGE_KEYS.ADDRESSES,
    data,
    items => _.uniq(
      (items || []).filter(i => Web3.utils.isAddress(i)).map(i => Web3.utils.toChecksumAddress(i))
    )
  );
};

/* Networks */
export const getNetworks = () => {
  return getArray(STORAGE_KEYS.NETWORKS);
};

export const saveNetwork = data => {
  return addItemToArray(STORAGE_KEYS.NETWORKS, data, items => _.uniq(items || []));
};

export const saveNetworks = data => {
  return addItemsToArray(STORAGE_KEYS.NETWORKS, data, items => _.uniq(items || []));
};


/* Smart Contract Wallet */
export const getWalletAddress = chainId => {
  return readFromStorage(STORAGE_KEYS.WALLET_ADDRESSES).then(res => {
    return res && res[chainId] || null;
  }).catch(e => {
    throw e;
  });
};

export const getWalletAddresses = () => {
  return readFromStorage(STORAGE_KEYS.WALLET_ADDRESSES).then(res => {
    return res && typeof res === 'object'? res : null;
  }).catch(e => {
    throw e;
  });
};

export const saveWalletAddress = (chainId, address) => {
  return updateMap(STORAGE_KEYS.WALLET_ADDRESSES, {[chainId]: address});
};


/* Transactions */
export const getPaymentRequests = () => {
  return getArray(STORAGE_KEYS.PAYMENTS);
};

export const savePaymentRequest = data => {
  return addItemToArray(STORAGE_KEYS.PAYMENTS, data, deduplicatePayments);
};

export const savePaymentRequests = data => {
  return addItemsToArray(STORAGE_KEYS.PAYMENTS, data, deduplicatePayments);
};

/* Transactions */
export const getTransactions = () => {
  return getArray(STORAGE_KEYS.TRANSACTIONS);
};

export const saveTransaction = data => {
  return addItemToArray(STORAGE_KEYS.TRANSACTIONS, data, items => _.uniqBy(items || [], 'hash'));
};

export const saveTransactions = data => {
  return addItemsToArray(STORAGE_KEYS.TRANSACTIONS, data, items => _.uniqBy(items || [], 'hash'));
};

export const updateTransaction = (hash, updates) => {
  return getTransactions().then(existingTransactions => {
    const transaction = existingTransactions.find(i => i.hash === hash);
    if(transaction) {
      return saveTransactions({
        ...transaction,
        ...updates,
      });
    } else {
      throw new Error('Transaction not found');
    }
  }).catch(e => {
    throw e;
  });
};