import {ORIGINS} from '../constants';
import {parsePaymentType} from '../utils';
import { Meta, Identity, PaymentRequest as PaymentRequestType } from '../data/types';

const EIP712_NOT_SUPPORTED_ERROR_MSG = "EIP712 is not supported by user's wallet";
const METAMASK_REJECT_CONFIRM_TX_ERROR_CODE = 4001;

const EIP712_DOMAIN = [
  {name: 'name', type: 'string',},
  {name: 'version', type: 'string'}
];

const SIGN_TYPED_DATA_VERSION = {
  V1: 'V1',
  V3: 'V3',
  V4: 'V4'
}

const isKeystoneError = (err) => {
  return err.message.startsWith('#ktek_error')
};

const signTypedDataVersion = (provider, typedData, version) => {
  let method = 'eth_signTypedData_v3';
  if (version === SIGN_TYPED_DATA_VERSION.V4) {
    method = 'eth_signTypedData_v4';
  }
  if (!version) {
    method = 'eth_signTypedData';
  }

  const data = typedData && typedData.message;
  const sender = data && data.creator && data.creator.address;
  const jsonTypedData = JSON.stringify(typedData);

  return new Promise((resolve, reject) => {
    provider.request({
      jsonrpc: '2.0',
      method,
      params: (version === SIGN_TYPED_DATA_VERSION.V3 || version === SIGN_TYPED_DATA_VERSION.V4) ? [sender, jsonTypedData] : [jsonTypedData, sender],
      from: sender,
      id: new Date().getTime(),
    }).then(signature => {
      if(signature) {
        resolve(signature);
      } else {
        reject(new Error(EIP712_NOT_SUPPORTED_ERROR_MSG));
      }
    }).catch(err => {
      reject(err);
    });
  });
};

export const signTypedData = async (provider, typedData) => {
  let signature;
  for (const version of [
    SIGN_TYPED_DATA_VERSION.V3,
    SIGN_TYPED_DATA_VERSION.V4,
    SIGN_TYPED_DATA_VERSION.V1,
  ]) {
    try {
      signature = await signTypedDataVersion(provider, typedData, version);
      break;
    } catch (err) {
      console.error('signTypedData error: ', version, err);
      if (err.code === METAMASK_REJECT_CONFIRM_TX_ERROR_CODE) {
        throw err;
      }
      if (isKeystoneError(err)) {
        throw err;
      }
    }
  }
  if(signature) {
    return signature;
  }
  throw new Error('Failed to sign the data');
};

export const PaymentRequest = async (provider, data) => {
  const payload = parsePaymentType(data, false);
  const {meta} = payload || {};
  const {origin, format, version} = meta || {};

  let PaymentRequestTypeDefinition = PaymentRequestType.Definition;
  for (const key of ['payer', 'note', 'reference', 'dueDate', 'createdAt']) {
    if(key && (!payload || !payload[key])) {
      PaymentRequestTypeDefinition = PaymentRequestTypeDefinition.filter(i => i.name !== key);
    }
  }

  let MetaTypeDefinition = Meta.Definition;
  if(meta && !meta.updateOf) {
    MetaTypeDefinition = MetaTypeDefinition.filter(i => i.name !== 'updateOf');
  }

  return signTypedData(provider,{
    types: {
      EIP712Domain: EIP712_DOMAIN,
      PaymentRequest: PaymentRequestTypeDefinition,
      Meta: MetaTypeDefinition,
      Identity: Identity.Definition,
    },
    domain: {
      name: origin || ORIGINS.GRINDERY,
      version: [format, version].filter(Boolean).join(':'),
    },
    primaryType: 'PaymentRequest',
    message: payload,
  });
};