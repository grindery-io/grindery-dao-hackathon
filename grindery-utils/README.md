# Grindery Utilities

Collection of commonly used utilities for Grindery

## Install

NPM

```
npm install --save @grindery/utils
```

YARN

```
yarn add @grindery/utils
```


## Usage

### Payment Requests

#### Schema
See full schema for payment requests [here](https://github.com/grindery-io/grindery-utils/blob/master/src/data/types/PaymentRequest/)


#### Sign Payment Request

_Generate an EIP712 signature for the payment request_

``` JavaScript
import {web3 as gWeb3} from '@grindery/utils';

const signature = await gWeb3.sign.PaymentRequest(provider, data);
// "data" must include all required fields except for "signature"
```

#### Save Payment Request

_Saving the payment request to IPFS storage_

``` JavaScript
import {storage as gStorage} from '@grindery/utils';

const ipfsUrl = 'http://localhost:5001/api/v0'; 
// replace with IPFS node/gateway HTTP API url

const {cid} = await gStorage.ipfs(ipfsUrl).PaymentRequest.add(data);
// "data" must include all required fields including the "signature"
```

**NOTE:**
Save the returned cid/hash to your local datastore and use it as the `meta.updateOf` value for updates


### Batch Payments

#### Schema
See full schema for batch payments [here](https://github.com/grindery-io/grindery-utils/blob/master/src/data/types/BatchPayment/)


#### Save Batch Payment

_Saving batch payment to IPFS storage_
```JavaScript
const {cid} = await gStorage.ipfs(ipfsUrl).BatchPayment.add(data);
```