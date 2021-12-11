/*global chrome*/
import Web3 from 'web3';
import moment from 'moment';

import {
  ADDRESS_ZERO,
  CUSTOM_TOKENS,
  EVENT_SIGNATURES,
  MESSAGE_TYPES,
  NETWORKS,
  NOTIFICATIONS,
  TASKS,
  WALLET_EVENTS,
  PAYMENT_OPTIONS, ACTIONS, META_TRIGGERS, META_EVENTS,
} from './helpers/contants';
import {createProvider, createWeb3, getAccounts, getBalance, getNetwork, requestAccounts} from './helpers/metamask';
import {
  getTransactions,
  saveAddresses,
  saveNetwork,
  saveSnapshot,
  saveTransaction,
  saveTransactions,
  saveWalletAddress
} from './helpers/storage';
import {
  getWeb3Instance,
  sendExtensionEvent,
  sendExtensionNotification, sendMetaRequest,
  syncWithGoogleSheets
} from './helpers/routines';
import {ERROR_MESSAGES} from './helpers/errors';
import {getNetworkExplorerUrl, getPaymentsTotal} from './helpers/utils';

import contractsInfo from './helpers/contracts.json';
import {syncPaymentRequests} from "./helpers/meta";

const isPopUpOrTabOpen = () => {
  const popupsAndTabs = [
    ...(chrome.extension.getViews({ type: 'popup' }) || []),
    ...(chrome.extension.getViews({ type: 'tab' }) || []),
  ];
  return popupsAndTabs && Array.isArray(popupsAndTabs) && popupsAndTabs.length;
};

chrome.browserAction.onClicked.addListener((tab) => {
  if(tab && tab.id) {
    const url = tab.url;
    if(
      /(\w+\.)?client\.aragon\.org$/i.test(url) || // Aragon
      /(\w+\.)?gnosis-safe\.io$/i.test(url) || // Gnosis Safe
      /(\w+\.)?multisig\.harmony\.one$/i.test(url) // Harmony MultiSig
    ) {
      sendMetaRequest(ACTIONS.TOGGLE_META_POPUP, tab.id).catch(e => {
        console.error('tab:toggle meta popup: error:', e, tab.id);
      });
    } else {
      chrome.tabs.executeScript(tab.id,{
        file: 'content.js'
      }, () => {
      });
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(chrome.runtime.lastError) {
    console.error('onMessage chrome.runtime.lastError => ', chrome.runtime.lastError.message || chrome.runtime.lastError);
    return;
  }

  const sendSuccessResponse = data => {
    sendResponse({
      data,
    });
  };

  const sendErrorResponse = error => {
    sendResponse({
      error: (error && error.message) || (error && typeof error === 'string' && error) || ERROR_MESSAGES.UNKNOWN,
    });
  };

  if(message && message.type === MESSAGE_TYPES.TASK) {
    const task = message && message.task || null,
      payload = message && message.payload || null;
    if(task) {
      const web3 = getWeb3Instance();
      switch (task) {
        case TASKS.REQUEST_ACCOUNTS: {
          requestAccounts(web3)
            .then(accounts => {
              sendSuccessResponse(accounts);
              saveAddresses(accounts).catch(() => {});
            })
            .catch(e => sendErrorResponse(e));
          return true;
        }
        case TASKS.GET_ACCOUNTS: {
          getAccounts(web3)
            .then(accounts => {
              sendSuccessResponse(accounts);
              saveAddresses(accounts).catch(() => {});
            })
            .catch(e => sendErrorResponse(e));
          return true;
        }
        case TASKS.LISTEN_FOR_WALLET_EVENTS: {
          const {events} = payload || {};
          if(web3.currentProvider && events && Array.isArray(events) && events.length) {
            for (const eventName of events) {
              web3.currentProvider.on(eventName, res => {
                sendExtensionEvent(eventName, {data: res}).catch(() => {});
              });
            }
          }
          return false;
        }
        case TASKS.GET_NETWORK: {
          getNetwork(web3)
            .then(network => {
              sendSuccessResponse(network);
              saveNetwork(network).catch(() => {});
            })
            .catch(e => sendErrorResponse(e));
          return true;
        }
        case TASKS.GET_BALANCE: {
          const {address} = payload || {};
          if(address) {
            getBalance(address, web3)
              .then(balance => sendSuccessResponse(balance))
              .catch(e => sendErrorResponse(e));
            return true;
          }
          sendErrorResponse(ERROR_MESSAGES.INVALID_WALLET_ADDRESS);
          break;
        }
        case TASKS.MAKE_PAYOUT: {
          const paidAt = moment.utc().format();
          if(payload) {
            const { from, to, value, abi, contractAddress, data, meta, snapshot, paymentMethod, inspector :inputInspector } = payload || {};
            const inspector = {
              ...inputInspector,
              createdAt: paidAt,
            };
            if(from) {
              let walletCall = null,
                errorMessage = '';

              const isNormalWalletPayment = paymentMethod === PAYMENT_OPTIONS.DEFAULT;
              const isSmartWalletPayment = [PAYMENT_OPTIONS.SMART_WALLET, PAYMENT_OPTIONS.SMART].includes(paymentMethod);
              const isDelegatedPayment = [
                PAYMENT_OPTIONS.DELEGATED_TRANSFER, PAYMENT_OPTIONS.ARAGON, PAYMENT_OPTIONS.GNOSIS,
                PAYMENT_OPTIONS.DAO
              ].includes(paymentMethod);
              const isAragonPayment = paymentMethod === PAYMENT_OPTIONS.ARAGON;
              const isGnosisPayment = paymentMethod === PAYMENT_OPTIONS.GNOSIS;

              if(abi && contractAddress && data) {
                // Contract Payout
                const contract = new web3.eth.Contract(abi, contractAddress);
                const batchTransferArguments = data || [];
                const contractCall = contract && contract.methods && (contract.methods.batchTransfer || contract.methods.payout);

                if(contractCall) {
                  walletCall = contractCall(...batchTransferArguments).send({
                    from,
                    ...(isNormalWalletPayment?{
                      value: Web3.utils.toHex(value),
                    }:{}),
                  });
                } else {
                  errorMessage = ERROR_MESSAGES.NETWORK_BATCH_NOT_SUPPORTED;
                }
              } else if(isDelegatedPayment) {
                // Delegated batch transfer
                const { abi, bytecode } = contractsInfo && contractsInfo.delegatedBatch || {};
                if(abi && bytecode) {
                  walletCall = new web3.eth.Contract(abi).deploy({
                    data: bytecode,
                    arguments: data || [],
                  }).send({
                    from,
                  });
                }
              } else if(to) {
                // Direct Payout
                walletCall = web3.eth.sendTransaction({
                  from,
                  to,
                  value: Web3.utils.toHex(value),
                });
              }

              if(walletCall) {
                let confirmationsReceived = 0;
                walletCall.on('transactionHash', hash => {
                  // Transaction has been sent
                  saveTransaction({
                    ...meta,
                    hash,
                    confirmed: false,
                    delegated: isDelegatedPayment,
                    paymentMethod,
                    paid_at: paidAt,
                  }).then(() => {
                    sendExtensionNotification(NOTIFICATIONS.PAYOUT_INITIATED, {
                      hash,
                      paymentMethod,
                      ...(isAragonPayment && meta && meta.aragon?{
                        aragon: meta.aragon,
                      }:{}),
                      ...(isGnosisPayment && meta && meta.gnosis?{
                        gnosis: meta.gnosis,
                      }:{}),
                    }).catch(() => {});
                  }).catch(() => {});
                  sendSuccessResponse(hash);

                  if(!isPopUpOrTabOpen() && snapshot) {
                    saveSnapshot({
                      ...snapshot,
                      state: {
                        hash,
                        processing: true,
                        sent: true,
                        paymentMethod,
                        ...(isAragonPayment && meta && meta.aragon?{
                          aragon: meta.aragon,
                        }:{}),
                        ...(isGnosisPayment && meta && meta.gnosis?{
                          gnosis: meta.gnosis,
                        }:{}),
                      }
                    }).catch(() => {});
                  }
                }).on('confirmation', (confirmationNumber, receipt) => {
                  confirmationsReceived += 1;
                  if(receipt && receipt.transactionHash) {
                    if(confirmationsReceived < 2) {
                      saveTransaction({
                        ...meta,
                        hash: receipt.transactionHash,
                        confirmed: true,
                        delegated: isDelegatedPayment,
                        ...((isDelegatedPayment && receipt.contractAddress)?{
                          delegatedAddress: receipt.contractAddress,
                        }:{}),
                        paymentMethod,
                        paid_at: paidAt,
                      }).catch(() => {});

                      sendExtensionNotification(NOTIFICATIONS.PAYOUT_COMPLETED, {
                        hash: receipt.transactionHash,
                        receipt,
                        paymentMethod,
                        ...((isDelegatedPayment && receipt.contractAddress)?{
                          delegatedAddress: receipt.contractAddress,
                        }:{}),
                        ...(isAragonPayment && meta && meta.aragon?{
                          aragon: meta.aragon,
                        }:{}),
                        ...(isGnosisPayment && meta && meta.gnosis?{
                          gnosis: meta.gnosis,
                        }:{}),
                        inspector
                      }).catch(() => {});

                      if(!isPopUpOrTabOpen() && snapshot) {
                        saveSnapshot({
                          ...snapshot,
                          state: {
                            hash: receipt.transactionHash,
                            paid: true,
                            paymentMethod,
                            ...((isDelegatedPayment && receipt.contractAddress)?{
                              delegatedAddress: receipt.contractAddress,
                            }:{}),
                            ...(isAragonPayment && meta && meta.aragon?{
                              aragon: meta.aragon,
                            }:{}),
                            ...(isGnosisPayment && meta && meta.gnosis?{
                              gnosis: meta.gnosis,
                            }:{}),
                          }
                        }).catch(() => {});
                      }
                    }
                  }
                }).on('receipt', receipt => {
                  // Receipt
                }).on('error', (error, receipt) => {
                  sendErrorResponse();
                  if(receipt && receipt.transactionHash) {
                    sendExtensionNotification(NOTIFICATIONS.PAYOUT_FAILED, {
                      hash: receipt.transactionHash,
                      error,
                      receipt,
                      paymentMethod,
                      ...(isAragonPayment && meta && meta.aragon?{
                        aragon: meta.aragon,
                      }:{}),
                      ...(isGnosisPayment && meta && meta.gnosis?{
                        gnosis: meta.gnosis,
                      }:{}),
                      inspector
                    }).catch(() => {});

                    if(!isPopUpOrTabOpen() && snapshot) {
                      saveSnapshot({
                        ...snapshot,
                        state: {
                          hash: receipt.transactionHash,
                          error: 'Failed to make payment',
                          paymentMethod,
                          ...(isAragonPayment && meta && meta.aragon?{
                            aragon: meta.aragon,
                          }:{}),
                          ...(isGnosisPayment && meta && meta.gnosis?{
                            gnosis: meta.gnosis,
                          }:{}),
                        }
                      }).catch(() => {});
                    }
                  }
                }).then(res => {
                  if(res && res.transactionHash) {
                    saveTransaction({
                      ...meta,
                      hash: res.transactionHash,
                      confirmed: true,
                      delegated: isDelegatedPayment,
                      ...((isDelegatedPayment && res.contractAddress)?{
                        delegatedAddress: res.contractAddress,
                      }:{}),
                      paymentMethod,
                      paid_at: paidAt,
                    }).catch(() => {});

                    sendExtensionNotification(NOTIFICATIONS.PAYOUT_COMPLETED, {
                      hash: res.transactionHash,
                      receipt: res,
                      paymentMethod,
                      ...((isDelegatedPayment && res.contractAddress)?{
                        delegatedAddress: res.contractAddress,
                      }:{}),
                      ...(isAragonPayment && meta && meta.aragon?{
                        aragon: meta.aragon,
                      }:{}),
                      ...(isGnosisPayment && meta && meta.gnosis?{
                        gnosis: meta.gnosis,
                      }:{}),
                      inspector
                    }).catch(() => {});

                    if(!isPopUpOrTabOpen()) {
                      if(snapshot) {
                        saveSnapshot({
                          ...snapshot,
                          state: {
                            hash: res.transactionHash,
                            paid: true,
                            paymentMethod,
                            ...((isDelegatedPayment && res.contractAddress)?{
                              delegatedAddress: res.contractAddress,
                            }:{}),
                            ...(isAragonPayment && meta && meta.aragon?{
                              aragon: meta.aragon,
                            }:{}),
                            ...(isGnosisPayment && meta && meta.gnosis?{
                              gnosis: meta.gnosis,
                            }:{}),
                          }
                        }).catch(() => {});
                      }

                      if(meta && (meta.payments || meta.payment)) {
                        let payments = [];
                        if(meta.payments && Array.isArray(meta.payments) && meta.payments.length) {
                          payments = meta.payments;
                        } else if(meta.payment) {
                          payments = [meta.payment];
                        }

                        if(payments.length) {
                          const fiatTotal = getPaymentsTotal(payments),
                            numRecipients = payments.length;
                          const explorerUrl = meta.chain && getNetworkExplorerUrl(meta.chain) || null;
                          chrome.notifications.create(explorerUrl && `${explorerUrl}/tx/${encodeURIComponent(res.transactionHash || '')}` || '', {
                            title: isDelegatedPayment?'Smart address created':'Payment completed',
                            message: `$${fiatTotal} to ${numRecipients} recipient${numRecipients === 1?'':'s'}`,
                            iconUrl: chrome.runtime.getURL('logo.png'),
                            type: 'basic'
                          }, () => {});
                        }
                      }
                    }
                  }
                }).catch(e => {
                  console.error('failed to make payout => ', e);
                });
                return true;
              } else {
                sendErrorResponse(errorMessage);
                return true;
              }
            }
          }
          break;
        }
        case TASKS.SYNC_EXTERNAL_DATA: {
          const {address} = payload || {};
          if(address) {
            syncPaymentRequests(address);
          }
          syncWithGoogleSheets().then(() => {
            sendSuccessResponse('synced');
          }).catch(e => {
            sendErrorResponse(e);
          });
          return true;
        }
        case TASKS.CLEAN_TRANSACTIONS: {
          getTransactions().then(async res => {
            const allTransactions = (res && Array.isArray(res) ? res : []);
            const pendingDirectTransactions = allTransactions.filter(
              i => typeof i.confirmed === 'boolean' && !i.confirmed && !i.delegated
            );
            const pendingDelegatedTransactions = allTransactions.filter(
              i => typeof i.confirmed === 'boolean' && i.confirmed && i.delegated && !i.delegatedConfirmed && (i.delegatedAddress || i.smartAddress)
            );
            const delegatedAddresses = pendingDelegatedTransactions.map(i => i.delegatedAddress || i.smartAddress);

            let completedTransactions = [],
              completedTransactionsMeta = {};

            if (web3) {
              if(pendingDirectTransactions.length) {
                for (const transaction of pendingDirectTransactions) {
                  if (transaction && transaction.hash && !transaction.gnosisMultiSend) {
                    const receipt = await web3.eth.getTransactionReceipt(transaction.hash).catch(() => {});
                    if (receipt && receipt.status) {
                      completedTransactions.push(transaction.hash);
                    }
                  }
                }
              }

              if(delegatedAddresses.length) {
                const currentBlockNumber = await web3.eth.getBlockNumber();
                const logs = await web3.eth.getPastLogs({
                  fromBlock: currentBlockNumber - 100000,
                  topics: [
                    EVENT_SIGNATURES.BATCH_TRANSFER,
                  ]
                }).catch(() => {});
                const delegatedAddressLogs = logs.filter(i => delegatedAddresses.includes(i.address));
                for (const log of delegatedAddressLogs) {
                  const transaction = pendingDelegatedTransactions.find(i => (i.delegatedAddress === log.address || i.smartAddress === log.address))
                  completedTransactions.push(transaction.hash);
                  completedTransactionsMeta[transaction.hash] = {
                    delegatedHash: log.transactionHash,
                  }
                }
              }
            }

            if (completedTransactions.length) {
              let newTransactions = (allTransactions || []).map(i => {
                if (completedTransactions.includes(i.hash)) {
                  return {
                    ...i,
                    confirmed: true,
                    ...(i.delegated?{
                      delegatedConfirmed: true,
                      ...(!i.delegatedAddress && i.smartAddress?{
                        delegatedAddress: i.smartAddress,
                      }:{}),
                    }:{}),
                    ...((completedTransactionsMeta && completedTransactionsMeta[i.hash])?{
                      ...(completedTransactionsMeta[i.hash] || {}),
                    }:{}),
                  }
                }
                return i;
              });
              saveTransactions(newTransactions).then(() => {}).catch(() => {});
            }
            sendSuccessResponse(allTransactions);
          }).catch(e => {
            sendErrorResponse(e);
          });
          return true;
        }
        case TASKS.CREATE_WALLET: {
          const { account, chain, smartWallets, stableCoin, terraAddress } = payload || {};
          const contractDetails = chain && contractsInfo && contractsInfo.wallet && contractsInfo.wallet[chain];
          const { abi, bytecode, swap, bridge, bridge_erc20, bridge_terra } = contractDetails || {};

          if(account && chain && [
            NETWORKS.HARMONY_TESTNET.chainId,
            NETWORKS.KOVAN.chainId,
            NETWORKS.ROPSTEN.chainId,
            NETWORKS.RINKEBY.chainId,
          ].includes(chain) && abi && bytecode) {
            let constructorArgs = [];

            if(chain === NETWORKS.HARMONY_TESTNET.chainId) {
              const getTokenAddress = symbol => {
                return contractsInfo && contractsInfo.token && contractsInfo.token[symbol] &&
                  contractsInfo.token[symbol].chains && contractsInfo.token[symbol].chains[chain] || ADDRESS_ZERO;
              };
              constructorArgs = [
                smartWallets[NETWORKS.KOVAN.chainId] || account, // _bridgeBurnRecipient
                bridge_erc20, // _bridgeBurnERC20ContractAddress
                terraAddress || Web3.utils.toHex(""), // _bridgeBurnTerraRecipient
                bridge_terra, // _bridgeBurnTerraERC20ContractAddress
                swap, // _swapContractAddress
                getTokenAddress(stableCoin || 'UST'), // _swapTokenAddress
                getTokenAddress('1ETH') // _swapToBridgeTokenAddress
              ];
            } else if(chain === NETWORKS.KOVAN.chainId) {
              constructorArgs = [
                smartWallets[NETWORKS.HARMONY_TESTNET.chainId] || account, // _bridgeLockRecipient
                bridge, // _bridgeLockContractAddress
                bridge_erc20, // _bridgeLockERC20ContractAddress
              ];
            } else {
              constructorArgs = [
                ADDRESS_ZERO, // _bridgeLockRecipient
                ADDRESS_ZERO, // _bridgeLockContractAddress
                ADDRESS_ZERO, // _bridgeLockERC20ContractAddress
              ];
            }

            const walletCall = new web3.eth.Contract(abi).deploy({
              data: bytecode,
              arguments: constructorArgs,
            }).send({
              from: account,
            });
            let confirmationsReceived = 0;
            walletCall.on('transactionHash', hash => {
              // Transaction has been sent
              sendExtensionNotification(NOTIFICATIONS.CREATE_WALLET_INITIATED, {
                hash,
              }).catch(() => {});

              sendSuccessResponse(hash);
            }).on('confirmation', (confirmationNumber, receipt) => {
              confirmationsReceived += 1;
              if(receipt && receipt.contractAddress) {
                if(confirmationsReceived < 2) {
                  // save new wallet
                  saveWalletAddress(chain, receipt.contractAddress).catch(() => {});

                  sendExtensionNotification(NOTIFICATIONS.CREATE_WALLET_COMPLETED, {
                    hash: receipt.transactionHash,
                    contractAddress: receipt.contractAddress,
                    receipt,
                  }).catch(() => {});
                }
              }
            }).on('receipt', receipt => {
              // Receipt
              if(receipt && receipt.contractAddress) {
                saveWalletAddress(chain, receipt.contractAddress).catch(() => {});
              }
            }).on('error', (error, receipt) => {
              sendErrorResponse();
              if(receipt && receipt.transactionHash) {
                sendExtensionNotification(NOTIFICATIONS.CREATE_WALLET_FAILED, {
                  hash: receipt.transactionHash,
                  error,
                  receipt,
                }).catch(() => {});
              }
            }).then(res => {
              if(res && res.contractAddress) {
                // save new wallet address
                saveWalletAddress(chain, res.contractAddress).catch(e => {
                  console.error('failed to save wallet => ', e);
                });

                sendExtensionNotification(NOTIFICATIONS.CREATE_WALLET_COMPLETED, {
                  hash: res.transactionHash,
                  contractAddress: res.contractAddress,
                  receipt: res,
                }).catch(() => {});

                if(!isPopUpOrTabOpen()) {
                  chrome.notifications.create('', {
                    title: 'Smart Wallet created',
                    message: 'Your smart wallet has been created',
                    iconUrl: chrome.runtime.getURL('logo.png'),
                    type: 'basic'
                  }, () => {});
                }
              }
            });
            return true;
          }
          break;
        }
        case TASKS.CHANGE_NETWORK: {
          const { chain } = payload || {}, provider = web3.currentProvider;
          if(chain && provider) {
            provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{
                chainId: Web3.utils.toHex(chain)
              }],
            }).then(res => {
              sendSuccessResponse(chain);
            }).catch(e => {
              sendErrorResponse();
            });
            return true;
          }
          break;
        }
        case TASKS.GET_TOKEN_BALANCE: {
          const {address, token, chain} = payload || {};
          const erc20abi = contractsInfo && contractsInfo.erc20 && contractsInfo.erc20.abi,
            tokenAddress = contractsInfo && contractsInfo.token && contractsInfo.token[token] && contractsInfo.token[token].chains && contractsInfo.token[token].chains[chain];
          if(address && token && chain && erc20abi && tokenAddress) {
            const tokenAddress = contractsInfo.token[token].chains[chain];
            const contract = new web3.eth.Contract(erc20abi, tokenAddress);
            if(contract && contract.methods && contract.methods.balanceOf) {
              contract.methods.balanceOf(address).call().then(res => {
                sendSuccessResponse(res);
              }).catch(e => {
                sendErrorResponse();
              });
              return true;
            }
          }
          break;
        }
        case TASKS.OPEN_META_POPUP: {
          const {query} = payload || {};
          const tabId = sender && sender.tab && sender.tab.id;
          if(tabId) {
            sendMetaRequest(ACTIONS.OPEN_META_POPUP, tabId, {query}).catch(e => {
              console.error('tab:open meta popup: error:', e, tabId);
            });
          }
          sendSuccessResponse('received!');
          return;
        }
        case TASKS.RELAY_META_EVENT: {
          const {query} = payload || {};
          if(query) {
            sendExtensionEvent(META_EVENTS.QUERY, {query}).catch(e => {
              console.error('failed to relay meta event:', e, query);
            });
          }
          sendSuccessResponse('received!');
          return;
        }
        default: {
          break;
        }
      }
    }
    sendErrorResponse();
  }
});

chrome.notifications.onClicked.addListener(notificationId => {
  if(/^[\w]+:\/\//i.test(notificationId)) {
    chrome.tabs.create({ url: notificationId });
  }
});

const getNetworkId = async () => {
  const web3 = createWeb3();
  return web3 && web3.eth.getChainId();
};

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const {tabId} = activeInfo || {};
  if(tabId) {
    sendMetaRequest(ACTIONS.ADD_META, tabId, {
      trigger: META_TRIGGERS.UPDATED,
      networkId: await getNetworkId(),
    }).catch(e => {
      console.error('tab:onActivated: meta error:', e, tabId);
    });
  }
});

chrome.tabs.onUpdated.addListener(async  (tabId, changeInfo, tab) => {
  if(tabId && changeInfo && changeInfo.status === 'complete') {
    sendMetaRequest(ACTIONS.ADD_META, tabId, {
      trigger: META_TRIGGERS.UPDATED,
      networkId: await getNetworkId(),
    }).catch(e => {
      console.error('tab:onUpdated: meta error:', e, tabId);
    });
  }
});

