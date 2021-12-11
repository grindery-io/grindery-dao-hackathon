import semverSatisfies from 'semver/functions/satisfies';
import { SignTypedDataVersion } from '@metamask/eth-sig-util';

import {createWeb3} from './metamask';

const EIP712_NOT_SUPPORTED_ERROR_MSG = "EIP712 is not supported by user's wallet";
const EIP712_DOMAIN_BEFORE_V130 = [
  {
    type: 'address',
    name: 'verifyingContract',
  },
];

const EIP712_DOMAIN = [
  {
    type: 'uint256',
    name: 'chainId',
  },
  {
    type: 'address',
    name: 'verifyingContract',
  },
];

// This function returns the types structure for signing offchain messages
// following EIP712
export const getEip712MessageTypes = (safeVersion) => {
  const eip712WithChainId = semverSatisfies(safeVersion, '>=1.3.0')
  return {
    EIP712Domain: eip712WithChainId ? EIP712_DOMAIN : EIP712_DOMAIN_BEFORE_V130,
    SafeTx: [
      { type: 'address', name: 'to' },
      { type: 'uint256', name: 'value' },
      { type: 'bytes', name: 'data' },
      { type: 'uint8', name: 'operation' },
      { type: 'uint256', name: 'safeTxGas' },
      { type: 'uint256', name: 'baseGas' },
      { type: 'uint256', name: 'gasPrice' },
      { type: 'address', name: 'gasToken' },
      { type: 'address', name: 'refundReceiver' },
      { type: 'uint256', name: 'nonce' },
    ],
  }
}

export const generateTypedDataFrom = ({
  baseGas,
  data,
  gasPrice,
  gasToken,
  networkId,
  nonce,
  operation,
  refundReceiver,
  safeAddress,
  safeTxGas,
  safeVersion,
  to,
  value,
}) => {
  const eip712WithChainId = semverSatisfies(safeVersion, '>=1.3.0')

  return {
    types: getEip712MessageTypes(safeVersion),
    domain: {
      ...(eip712WithChainId?{
        chainId: networkId,
      }:{}),
      verifyingContract: safeAddress,
    },
    primaryType: 'SafeTx',
    message: {
      to,
      value,
      data,
      operation,
      safeTxGas,
      baseGas,
      gasPrice,
      gasToken,
      refundReceiver,
      nonce: Number(nonce),
    },
  };
}

export const getEIP712Signer = version => async (txArgs) => {
  const web3 = createWeb3();
  const typedData = await generateTypedDataFrom(txArgs);

  let method = 'eth_signTypedData_v3';
  if (version === SignTypedDataVersion.V4) {
    method = 'eth_signTypedData_v4';
  }
  if (!version) {
    method = 'eth_signTypedData';
  }

  const jsonTypedData = JSON.stringify(typedData);
  const signedTypedData = {
    jsonrpc: '2.0',
    method,
    params: (version === SignTypedDataVersion.V3 || version === SignTypedDataVersion.V4) ? [txArgs.sender, jsonTypedData] : [jsonTypedData, txArgs.sender],
    from: txArgs.sender,
    id: new Date().getTime(),
  };

  return new Promise((resolve, reject) => {
    const provider = web3.currentProvider;
    provider.request(signedTypedData).then(signature => {
      if(signature) {
        resolve(signature);
      } else {
        reject(new Error(EIP712_NOT_SUPPORTED_ERROR_MSG));
      }
    }).catch(err => {
      reject(err);
    });
  });
}
