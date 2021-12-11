# Payment Request

| Name            | Type      | Required? | Comment                                                                                                |
| --------------- | --------- | --------- | ------------------------------------------------------------------------------------------------------ |
| meta            | Meta      | Yes       | See [Meta](https://github.com/grindery-io/grindery-utils/blob/master/src/data/types/Meta.md)           |
| recipient       | Identity  | Yes       | See [Identity](https://github.com/grindery-io/grindery-utils/blob/master/src/data/types/Identity.md)   |
| amount          | string    | Yes       | Amount (in base currency)                                                                              |
| currency        | string    | Yes       | Currency code                                                                                          |
| payer           | object    | No        | See "payer" below                                                                                      |
| note            | string    | No        | Note about the payment                                                                                 |
| reference       | string    | No        | Reference of payment request in origin application/client                                              |
| dueDate         | datetime  | No        | Due date for the payment                                                                               |
| createdAt       | datetime  | No        | Creation date/time of the payment request                                                              |
| creator         | Identity  | Yes       | See [Identity](https://github.com/grindery-io/grindery-utils/blob/master/src/data/types/Identity.md)   |
| signature       | string    | Yes       | EIP712 signature of the payment request data by the creator                                            |


## payer

_Data about the payer_

| Name                | Type                     | Required? | Comment                                               |
| ------------------- | ------------------------ | --------- | ----------------------------------------------------- |
| address             | string                   | No        | Wallet address                                        |
| email               | string                   | No        | Email                                                 |
| name                | string                   | No        | Name                                                  |
| reference           | string                   | No        | Reference of payer in origin application/client       |
