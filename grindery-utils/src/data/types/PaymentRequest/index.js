import {Meta, Identity} from '../core';

export const PaymentRequest = {
  Type: 'PaymentRequest',
  Definition: [
    {name: 'meta', type: Meta.Type},
    {name: 'recipient', type: Identity.Type},
    {name: 'amount', type: 'string'},
    {name: 'currency', type: 'string'},
    {name: 'payer', type: Identity.Type},
    {name: 'note', type: 'string'},
    {name: 'reference', type: 'string'},
    {name: 'dueDate', type: 'string'},
    {name: 'createdAt', type: 'string'},
    {name: 'creator', type: Identity.Type},
  ],
};
