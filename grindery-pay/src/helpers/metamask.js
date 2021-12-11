/*global chrome*/
import Web3 from 'web3';
import {createExternalExtensionProvider} from '@metamask/providers';

export const createProvider = () => {
  let provider;
  try {
    provider = createExternalExtensionProvider();
  } catch (e) {
    console.error(`Metamask connect error `, e);
    provider = null;
  }
  if(!provider && window.ethereum) {
    provider = window.ethereum;
  }
  return provider;
};

export const createWeb3 = provider => {
  provider = provider || createProvider();
  return provider?new Web3(provider):null;
};

export const getAccounts = async web3 => {
  web3 = web3 || createWeb3();
  if(web3) {
    return web3.eth.getAccounts().then(res => {
      return res;
    }).catch(e => {
      throw new Error('Failed to get accounts');
    });
  } else {
    throw new Error('Failed to get web3 wrapper');
  }
};

export const requestAccounts = async web3 => {
  web3 = web3 || createWeb3();
  if(web3) {
    return web3.eth.requestAccounts().then(res => {
      return res;
    }).catch(e => {
      throw new Error('Failed to get accounts');
    });
  } else {
    throw new Error('Failed to get web3 wrapper');
  }
};

export const getNetwork = async web3 => {
  web3 = web3 || createWeb3();
  if(web3) {
    return web3.eth.net.getId().then(networkId => {
      return networkId;
    }).catch(e => {
      throw new Error('Failed to get network id');
    });
  } else {
    throw new Error('Failed to get web3 wrapper');
  }
};

export const getNetworkType = async web3 => {
  web3 = web3 || createWeb3();
  if(web3) {
    return web3.eth.net.getNetworkType().then(network => {
      return network;
    }).catch(e => {
      throw new Error('Failed to get network type');
    });
  } else {
    throw new Error('Failed to get web3 wrapper');
  }
};

export const getBalance = async (address, web3) => {
  web3 = web3 || createWeb3();
  if(web3) {
    return web3.eth.getBalance(address).then(balance => {
      return balance;
    }).catch(e => {
      throw new Error('Failed to get balance');
    });
  } else {
    throw new Error('Failed to get web3 wrapper');
  }
};

