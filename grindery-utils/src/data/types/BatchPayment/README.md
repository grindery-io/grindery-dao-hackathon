# Batch Payment

| Name              | Type                  | Required? | Comment                                                                                                           |
| ----------------- | --------------------- | --------- | ----------------------------------------------------------------------------------------------------------------- |
| meta              | Meta                  | Yes       | See [Meta](https://github.com/grindery-io/grindery-utils/blob/master/src/data/types/Meta.md)                      |
| payments          | Array<PaymentRequest> | Yes       | See [PaymentRequest](https://github.com/grindery-io/grindery-utils/blob/master/src/data/types/PaymentRequest/)    |
| note              | string                | No        | Note about the payment                                                                                            |
| reference         | string                | No        | Reference of payment request in origin application/client                                                         |
| paymentMethod     | string                | No        | Method use to make payment e.g "wallet", "aragon", "gnosis"                                                       |
| paymentMethodInfo | object                | No        | Additional key:value data about the payment method                                                                |
| batchAddress      | address               | No        | Address of batch payment smart contracts                                                                          |
| transactionHash   | string                | No        | Hash of the transaction                                                                                           |
| createdAt         | datetime              | No        | Creation date/time of the payment request                                                                         |
| creator           | Identity              | Yes       | See [Identity](https://github.com/grindery-io/grindery-utils/blob/master/src/data/types/Identity.md)              |
