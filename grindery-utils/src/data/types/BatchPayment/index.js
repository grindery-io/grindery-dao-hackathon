import {Meta, Identity} from '../core';
import {PaymentRequest} from '../PaymentRequest';

export const BatchPayment = {
  Type: 'BatchPayment',
  Definition: [
    {name: 'meta', type: Meta.Type},
    {name: 'payments', type: `${PaymentRequest.Type}[]`},
    {name: 'note', type: 'string'},
    {name: 'reference', type: 'string'},
    {name: 'paymentMethod', type: 'string'},
    {name: 'paymentMethodInfo', type: 'string'},
    {name: 'batchAddress', type: 'address'},
    {name: 'transactionHash', type: 'string'},
    {name: 'createdAt', type: 'string'},
    {name: 'creator', type: Identity.Type},
  ],
};
