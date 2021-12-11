import Web3 from 'web3';
import {hash as namehash} from 'eth-ens-namehash';
import _ from 'lodash';

import {
  ADDRESS_ZERO,
  ARAGON_APP_NAME,
  ARAGON_EVENT_SIGNATURES, ARAGON_FUNCTION_SIGNATURES, ARAGON_PM_ENS_SUFFIX, EMPTY_HEX_DATA, HEX_PREFIX, NETWORKS,
} from './contants';
import {createWeb3} from './metamask';

import aragonJSON from './aragon.json';
import aragonInfo from './aragon.json';

const DEFAULT_ARG_SIZE = 64;
const DEFAULT_BYTES_OFFSET = 32;
const CALL_SCRIPT_SPEC_ID = 1;

const getFunctionSignatureHash = signature => {
  return Web3.utils.sha3(signature).slice(2, 10);
};

const addHexPrefix = hex => `0x${hex || ''}`;

const removeHexPrefix = hex => (hex || '').replace(HEX_PREFIX, '');

const padHexLeft = (hex, length=DEFAULT_ARG_SIZE, symbol='0') => {
  return addHexPrefix(
    (removeHexPrefix(hex) || '').padStart(length, symbol || '0')
  );
};

const padHexRight = (hex, length=DEFAULT_ARG_SIZE, symbol='0') => {
  return (hex || '').padEnd(length, symbol || '0');
};

const getHexBytesLength = bytes => removeHexPrefix(bytes).length/2;

const hexifyAddress = address => (address || '').toLowerCase();

const parseReferenceString = (reference, size=128) => {
  const cleanedReference = (reference || ''),
    strLength = cleanedReference.length;;

  let referenceParts = [
    padHexLeft(Web3.utils.toHex(size), DEFAULT_ARG_SIZE), // item size in byte array
    padHexLeft(Web3.utils.toHex(strLength), DEFAULT_ARG_SIZE), // length of the string
  ].map(removeHexPrefix); // remove hex prefix (0x)

  if(strLength) {
    // Add actual reference string
    referenceParts.push(
      _.chunk( // Chunks of 64 characters each
        removeHexPrefix( // remove hex prefix
          Web3.utils.fromUtf8(cleanedReference) // hex reference
        ),
        DEFAULT_ARG_SIZE
      ).map(chunk => // Pad smaller chunk with 0's to the right
        padHexRight(chunk.join(''), DEFAULT_ARG_SIZE)
      ).join('')
    );
  }

  return addHexPrefix(referenceParts.join(''));
};

const parseWithdrawScript = (token, recipient, amount, reference) => {
  return addHexPrefix(
    [
      // Signature
      getFunctionSignatureHash(ARAGON_FUNCTION_SIGNATURES.NEW_IMMEDIATE_PAYMENT),
      // Arguments
      ...(
        [
          token,
          hexifyAddress(recipient),
          Web3.utils.toHex(amount)
        ].map(i => padHexLeft(i, DEFAULT_ARG_SIZE))
      ),
      parseReferenceString(reference)
    ].map(removeHexPrefix).join('')
  );
};

const parseCallScript = (target, bytes, specId=CALL_SCRIPT_SPEC_ID) => {
  return addHexPrefix([
    // Spec ID
    padHexLeft(Web3.utils.toHex(specId || CALL_SCRIPT_SPEC_ID), 8),
    // Target
    hexifyAddress(target),
    // Bytes Length
    padHexLeft(
      Web3.utils.toHex(
        getHexBytesLength(bytes)
      ), 8
    ),
    // Bytes
    bytes,
  ].map(removeHexPrefix).join(''));
};

const parseForwardData = (bytes, offset=DEFAULT_BYTES_OFFSET) => {
  return addHexPrefix([
    // Signature
    getFunctionSignatureHash(ARAGON_FUNCTION_SIGNATURES.FORWARD),
    // Offset
    padHexLeft(
      Web3.utils.toHex(offset || DEFAULT_BYTES_OFFSET), DEFAULT_ARG_SIZE
    ),
    // Bytes Length
    padHexLeft(
      Web3.utils.toHex(
        getHexBytesLength(bytes)
      ), DEFAULT_ARG_SIZE
    ),
    // Spec ID. Target, Bytes Length and Bytes
    bytes,
  ].map(removeHexPrefix).join(''));
};

export const getAragonAppId = name => {
  return namehash(`${name}${ARAGON_PM_ENS_SUFFIX}`);
};

export const getAragonApps = async (daoAddress, networkId) => {
  const web3 = createWeb3();
  const kernelContract = new web3.eth.Contract(aragonJSON.kernel.abi, daoAddress);

  const initBlock = await kernelContract.methods.getInitializationBlock().call();
  const fromBlock = parseInt(initBlock);
  const blockLimit = [NETWORKS.HARMONY.chainId, NETWORKS.HARMONY_TESTNET.chainId].includes(networkId)?
    1024: // Harmony
    100000; // Infura (used by metamask)
  const toBlock = fromBlock + blockLimit;

  const logs = await web3.eth.getPastLogs({
    address: daoAddress,
    fromBlock,
    toBlock,
    topics: [
      ARAGON_EVENT_SIGNATURES.NEW_APP_PROXY,
    ]
  }).catch(e => {
    console.error('get logs error: ', e);
  });

  let apps = {};
  if(logs && logs.length) {
    let appIdToNameMap = {};
    for (const key of Object.keys(ARAGON_APP_NAME)) {
      const appName = ARAGON_APP_NAME[key];
      appIdToNameMap[getAragonAppId(appName)] = appName;
    }

    for (const log of logs) {
      const {data} = log;
      const proxyAddress = `0x${data.slice(26, 66)}`;
      const appId = `0x${data.slice(-64)}`;

      if(Object.keys(appIdToNameMap).includes(appId)) {
        const appName = appIdToNameMap[appId];
        if(appName) {
          apps[appName] = {
            appName,
            appId,
            proxyAddress
          };
        }
      }
    }
  }

  return apps;
};

export const initiateAragonWithdraw = (recipient, amount, reference, apps, from, onStart, onSuccess, onError) => {
  const tokenManagerAbi = aragonInfo && aragonInfo[ARAGON_APP_NAME.TOKEN_MANAGER] && aragonInfo[ARAGON_APP_NAME.TOKEN_MANAGER].abi,
    tokenManagerAddress = apps && apps[ARAGON_APP_NAME.TOKEN_MANAGER] && apps[ARAGON_APP_NAME.TOKEN_MANAGER].proxyAddress,
    votingAddress = apps && apps[ARAGON_APP_NAME.VOTING] && apps[ARAGON_APP_NAME.VOTING].proxyAddress,
    financeAddress = apps && apps[ARAGON_APP_NAME.FINANCE] && apps[ARAGON_APP_NAME.FINANCE].proxyAddress;

  if(tokenManagerAbi && tokenManagerAddress && votingAddress && financeAddress) {
    const web3 = createWeb3();
    const tokenManagerContract = new web3.eth.Contract(tokenManagerAbi, tokenManagerAddress);
    if(tokenManagerContract && tokenManagerContract.methods && tokenManagerContract.methods.forward) {
      let confirmationsReceived = 0;

      const withdrawScript = parseWithdrawScript(ADDRESS_ZERO, recipient, amount, reference);
      const callScriptFinance = parseCallScript(financeAddress, withdrawScript);
      const forwardDataFinance = parseForwardData(callScriptFinance);
      const callScriptVoting = parseCallScript(votingAddress, forwardDataFinance);

      tokenManagerContract.methods.forward(callScriptVoting).send({
        from,
      }).on('transactionHash', hash => {
        if(onStart) {
          onStart(hash);
        }
      }).on('confirmation', (confirmationNumber, receipt) => {
        confirmationsReceived += 1;
        if(confirmationsReceived < 2) {
          if(onSuccess) {
            onSuccess(receipt, confirmationNumber);
          }
        }
      }).on('receipt', receipt => {
        // Receipt
      }).on('error', (error, receipt) => {
        console.error('aragon withdraw error: ', error, receipt);
        if(onError) {
          onError(error, receipt);
        }
      }).then(res => {
        if(onSuccess) {
          onSuccess(res);
        }
      });
    } else {
      if(onError) {
        onError();
      }
    }
  } else {
    if(onError) {
      onError();
    }
  }
};

export const canForwardAragonScript = async (sender, apps, script=EMPTY_HEX_DATA) => {
  const tokenManagerAbi = aragonInfo && aragonInfo[ARAGON_APP_NAME.TOKEN_MANAGER] && aragonInfo[ARAGON_APP_NAME.TOKEN_MANAGER].abi,
    tokenManagerAddress = apps && apps[ARAGON_APP_NAME.TOKEN_MANAGER] && apps[ARAGON_APP_NAME.TOKEN_MANAGER].proxyAddress;

  if(tokenManagerAbi && tokenManagerAddress) {
    const web3 = createWeb3();
    const tokenManagerContract = new web3.eth.Contract(tokenManagerAbi, tokenManagerAddress);
    if(tokenManagerContract && tokenManagerContract.methods && tokenManagerContract.methods.canForward) {
      return tokenManagerContract.methods.canForward(sender, script || EMPTY_HEX_DATA).call().then(res => {
        if(res) {
          return res;
        }
        throw new Error("Can't forward scripts");
      });
    }
  }
  throw new Error('Failed to verify ability to forward scripts');
};