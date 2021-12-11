# gPay/gMeta (Grindery)

[GitHub Repository](https://github.com/grindery-io/grindery-dao-hackathon)

[GitCoin Submission](https://gitcoin.co/hackathon/dao-global/projects/11739/grindery-meta)

## Short Pitch

DAOs waste time, money and headspace to manage payments and create reports. We provide DAO administrators with an easy to use, time saving tool to manage payments and produce trust-less reports for its members.


## Video Demo
[https://vimeo.com/655205768](https://vimeo.com/655205768)


## Dates

12th/Nov/21 for Gnosis integration for Grindery Pay (`/grindery-pay` directory) and gMeta (`/grindery-utils` and `grindery-meta` directory)


## Wallet Address

0xb33cB5D3ceD2A477A6C80910c2962De697dbbe48


## Contact

Name: Tim Delhaes

Email: tim@delhaes.com

Telegram: @edbong


## Testing Instructions for Judges

Below you find detailed, step by step testing instructions.
You can also watch [this video](https://vimeo.com/655217888) instead.


### Part 1
In this part of the demo you will learn how to use gPay to request payments and do batch payouts.

1. Create yourself as a contact with one of your wallet addresses using [this GForm](https://forms.gle/AXGSfuguo3NCNtSz9)

2. Submit a request with one of your wallet addresses using [this GForm](https://forms.gle/L1YMXbA5BQUF6yoZ9)

3. Install gPay Chrome Extension
    
    At the time of submission, the latest build of gPay is in the review process for the Chrome WebStore, 
    Therefore you'll need to install the extension manually
    
    3.1 Download the hackathon build (zip file) from [https://github.com/grindery-io/grindery-dao-hackathon/grindery-pay-2021.12.10-0.3.21](https://github.com/grindery-io/grindery-dao-hackathon/grindery-pay-2021.12.10-0.3.21)
    
    3.2 Unzip the shared downloaded zip file, it will create a directory named "grindery-pay-2021.12.10-0.3.21“
    
    3.3 Navigate to [chrome://extension](chrome://extension) (type into address bar)
    
    3.4 Enable "Developer mode" in the top right corner
    
    3.5 Click the "Load unpacked" button and select the extension directory ("grindery-pay-2021.12.10-0.3.21")
    
    **NOTE:** The current version in the [Chrome WebStore](https://chrome.google.com/webstore/detail/grindery-pay/ofnbfgahidjckegapdpkhigjljepcdme) is missing some features, 
    please use instructions above to test

4. Go to [this gSheet](https://docs.google.com/spreadsheets/d/1T_ZKUuESfAr5Apy9a4XPD02mCDw7MXxr0dLKJN5FtCM/edit#gid=597214855)

5. Pin the gPay Extension (for fast and access)

6. Switch your network to “Rinkeby Test Network” in Metamask

7. Open gPay Extension (over [gSheet](https://docs.google.com/spreadsheets/d/1T_ZKUuESfAr5Apy9a4XPD02mCDw7MXxr0dLKJN5FtCM/edit#gid=597214855))

8. Connect the gSheet "Grindery Demo DAO Wallets"

9. Review Contacts and Payment Requests in gPay.

10. Create a second payment request for yourself (or somebody else) in gPay

11. Create batch payment and pay it with your wallet, [Gnosis](https://gnosis-safe.io/app/welcome) or (Aragon)[https://client.aragon.org/#/]

12. From here you can proceed to Aragon or Gnosis or simply skip to part 2.


### Part 2
In this part of the demo you will see how to query gMeta to get transactional metadata for payments in process or already executed by the DAO.

1. Go to [Gnosis Safe Demo Safe](https://gnosis-safe.io/app/rin:0x0384F52f5c240293b0C67DCf32946148d0171d64/balances) / 0x0384F52f5c240293b0C67DCf32946148d0171d64

2. Open [transaction queue](https://gnosis-safe.io/app/rin:0x0384F52f5c240293b0C67DCf32946148d0171d64/transactions/queue) to see pending transaction

3. Click on "View Details in Grindery" to see metadata

4. Go to [history](https://gnosis-safe.io/app/rin:0x0384F52f5c240293b0C67DCf32946148d0171d64/transactions/history) of transactions

5. Click on "View Details in Grindery" to see metadata
