import { SignTypedDataVersion } from '@metamask/eth-sig-util';
import { TypedDataUtils } from 'eth-sig-util'; // Use because it supports v1
import axios from 'axios';
import Decimal from 'decimal.js';
import {getMultiSendCallOnlyDeployment} from '@gnosis.pm/safe-deployments';

import gnosisJson from './gnosis.json';
import {createWeb3} from './metamask';
import {generateTypedDataFrom, getEIP712Signer} from './EIP712Signer';
import {ADDRESS_ZERO, EMPTY_HEX_DATA, GNOSIS_OPERATIONS, NETWORKS} from './contants';

export const METAMASK_REJECT_CONFIRM_TX_ERROR_CODE = 4001;
export const HARMONY_MULTI_SEND_ADDRESS = '0xDEff67e9A02b4Ce60ff62F3CB5FFB41d48856285';

export const isKeystoneError = (err) => {
  return err.message.startsWith('#ktek_error')
};

export const getSafeContractInstance = safeAddress => {
  const gnosisSafeAbi = gnosisJson.safe.abi;
  if(gnosisSafeAbi) {
    const web3 = createWeb3();
    return new web3.eth.Contract(gnosisSafeAbi, safeAddress);
  }
  return null;
};

export const getTransactionsAPIRoot = networkId => {
  return gnosisJson && gnosisJson.txService[networkId || 1];
};

export const getGnosisSafeInfo = async (safeAddress, networkId) => {
  const txServiceUrl = getTransactionsAPIRoot(networkId);

  const getVersionFromContract = async () => {
    const safeContract = getSafeContractInstance(safeAddress);
    if(safeContract.methods && safeContract.methods.VERSION) {
      const version = await safeContract.methods.VERSION().call().catch(e => {
        console.error('version error: ', e);
      });
      if(version) {
        return {version};
      }
    }
    throw new Error('Failed to retrieve Gnosis safe');
  };

  if(txServiceUrl) {
    return axios.get(`${txServiceUrl}/safes/${safeAddress}/`).then(res => {
      if(res && res.data && res.data.version) {
        return res.data;
      } else {
        return getVersionFromContract();
      }
    }).catch(e => {
      return getVersionFromContract();
    });
  } else {
    return getVersionFromContract();
  }
};

export const getTransactionsAPIPath = networkId => [NETWORKS.HARMONY.chainId, NETWORKS.HARMONY_TESTNET.chainId].includes(networkId)?'/transactions':'/multisig-transactions';

export const getSafeTransactionsUrl = (safeAddress, networkId) => {
  const txServiceUrl = getTransactionsAPIRoot(networkId);
  if(txServiceUrl) {
    return `${txServiceUrl}/safes/${safeAddress}${getTransactionsAPIPath(networkId)}/?has_confirmations=True`;
  }
  return null;
};

export const getNewTxNonce = async (safeAddress, networkId) => {
  const txServiceUrl = getSafeTransactionsUrl(safeAddress, networkId);
  if(txServiceUrl) {
    const res = await axios.get(txServiceUrl, { params: { limit: 1 } }).catch(() => {});
    const lastTx = res && res.data.results[0] || null;
    if(lastTx) {
      return `${lastTx.nonce + 1}`;
    }
  }
  const safeContract = getSafeContractInstance(safeAddress);
  return (await safeContract.methods.nonce().call()).toString();
}

export function generateSafeTxHash(txArgs) {
  return `0x${TypedDataUtils.sign(generateTypedDataFrom(txArgs)).toString('hex')}`
}

export const signOffChain = async (
  txArgs,
  safeAddress,
  safeVersion,
  networkId,
) => {
  let signature;
  for (const signTypeVersion of [
    SignTypedDataVersion.V3,
    SignTypedDataVersion.V4,
    SignTypedDataVersion.V1,
  ]) {
    const signingFunc = getEIP712Signer(signTypeVersion);
    try {
      const safeTxHash = generateSafeTxHash({...txArgs, safeAddress, safeVersion, networkId}, signTypeVersion);
      signature = await signingFunc({ ...txArgs, safeTxHash, safeAddress, safeVersion, networkId });
      break;
    } catch (err) {
      console.error('gnosis off chain signing error: ', signTypeVersion, err);
      if (err.code === METAMASK_REJECT_CONFIRM_TX_ERROR_CODE) {
        throw err;
      }
      if (isKeystoneError(err)) {
        throw err;
      }
    }
  }
  return signature;
};

export const getMultiSendContractAddress = (networkId) => {
  const multiSendDeployment =
    getMultiSendCallOnlyDeployment({
      network: networkId.toString(),
    }) || getMultiSendCallOnlyDeployment();

  const isHarmony = [NETWORKS.HARMONY.chainId, NETWORKS.HARMONY_TESTNET.chainId].includes(networkId);
  return isHarmony?HARMONY_MULTI_SEND_ADDRESS:multiSendDeployment?.networkAddresses[networkId] ?? multiSendDeployment?.defaultAddress;
};

export const getMultiSendContract = (networkId, web3=null) => {
  if(!web3) {
    web3 = createWeb3();
  }

  const multiSendDeployment =
    getMultiSendCallOnlyDeployment({
      network: networkId.toString(),
    }) || getMultiSendCallOnlyDeployment();

  const contractAddress = getMultiSendContractAddress(networkId);
  return new web3.eth.Contract(multiSendDeployment?.abi, contractAddress);
};

export const encodeMultiSendCall = (txs, networkId, web3=null) => {
  if(!web3) {
    web3 = createWeb3();
  }
  const multiSend = getMultiSendContract(networkId);
  const joinedTxs = txs
    .map((tx) =>
      [
        web3.eth.abi.encodeParameter('uint8', 0).slice(-2),
        web3.eth.abi.encodeParameter('address', tx.to).slice(-40),
        // if you pass wei as number, it will overflow
        web3.eth.abi.encodeParameter('uint256', tx.value.toString()).slice(-64),
        web3.eth.abi.encodeParameter('uint256', web3.utils.hexToBytes(tx.data).length).slice(-64),
        tx.data.replace(/^0x/, ''),
      ].join(''),
    )
    .join('');

  return multiSend.methods.multiSend(`0x${joinedTxs}`).encodeABI();
}

export const initiateGnosisWithdraw = async (recipient, amount, data, operation, safeAddress, safeVersion, reference, from, networkId, onStart, onSuccess, onError) => {
  if(safeAddress) {
    const safeContract = getSafeContractInstance(safeAddress);
    if(safeContract && safeContract.methods && safeContract.methods.getTransactionHash) {
      const nonce = await getNewTxNonce(safeAddress, networkId);
      const txArgs = {
        to: recipient,
        value: new Decimal(amount).toString(),
        data: data || EMPTY_HEX_DATA,
        operation: operation || GNOSIS_OPERATIONS.CALL,
        nonce: Number.parseInt(nonce),
        safeTxGas: 0,
        baseGas: 0,
        gasPrice: 0,
        gasToken: ADDRESS_ZERO,
        refundReceiver: ADDRESS_ZERO,
        sender: from,
      };

      const signature = await signOffChain(txArgs, safeAddress, safeVersion, networkId).catch(e => {
        console.error('signing error: ', e);
      });

      if(signature) {
        const contractTransactionHash = await safeContract.methods
          .getTransactionHash(
            txArgs.to, txArgs.value, txArgs.data, txArgs.operation,
            txArgs.safeTxGas, txArgs.baseGas, txArgs.gasPrice, txArgs.gasToken,
            txArgs.refundReceiver, txArgs.nonce
          ).call();

        if(contractTransactionHash) {
          const txBody = {
            ...txArgs,
            contractTransactionHash,
            signature,
            origin: 'Grindery Pay',
          };

          const txServiceUrl = getSafeTransactionsUrl(safeAddress, networkId);
          if(txServiceUrl) {
            return axios.post(txServiceUrl, txBody).then(() => {
              if(onSuccess) {
                onSuccess(txBody);
              }
            }).catch(e => {
              if(onError) {
                onError(e, txBody);
              }
            });
          }
        }
      }
    }
  }
  onError();
};

export const getSafeTransactionByHash = (hash, networkId) => {
  const txServiceUrl = getTransactionsAPIRoot(networkId);
  if(txServiceUrl) {
    return axios.get(`${getTransactionsAPIRoot(networkId)}${getTransactionsAPIPath(networkId)}/${hash}`).then(res => {
      return res && res.data || null;
    });
  }
  return null;
};