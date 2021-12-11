import React, {useContext, useEffect, useMemo, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  FormGroup,
  Grid,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  FormHelperText, InputAdornment,
} from '@material-ui/core';
import {Cancel as CancelIcon, CheckCircle as CheckCircleIcon} from '@material-ui/icons';
import clsx from 'clsx';
import Web3 from 'web3';
import Decimal from 'decimal.js';
import moment from 'moment';
import {storage as gStorage} from '@grindery/utils';

import Dialog, {useStyles as dialogStyles} from '../containers/Dialog';
import Copy from '../shared/Copy';

import AppContext from '../../AppContext';

import useSmartWalletBalance from '../../hooks/useSmartWalletBalance';
import useDebounce from '../../hooks/useDebounce';

import {
  ADDRESS_ZERO,
  FIAT_CURRENCIES,
  NOTIFICATIONS,
  TASKS,
  PAYMENT_OPTIONS,
  PAYMENT_OPTIONS_DESCRIPTION,
  PAYMENT_OPTIONS_LABELS,
  LEGACY_AND_DISABLED_PAYMENT_OPTIONS,
  ACTIONS,
  ARAGON_APP_ENS_SUFFIX,
  ARAGON_APP_NAME,
  EMPTY_HEX_DATA, GNOSIS_OPERATIONS, IPFS_URL
} from '../../helpers/contants';
import {getPaymentContact, getPaymentsTotal, truncateAddress} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {listenForExtensionNotification, makeBackgroundRequest, sendContentRequest} from '../../helpers/routines';
import {createWeb3} from '../../helpers/metamask';
import {canForwardAragonScript, getAragonApps, initiateAragonWithdraw} from '../../helpers/aragon';
import {saveTransaction, updateTransaction} from '../../helpers/storage';
import {
  encodeMultiSendCall,
  getGnosisSafeInfo,
  getMultiSendContractAddress,
  initiateGnosisWithdraw
} from '../../helpers/gnosis';

import contractsInfo from '../../helpers/contracts.json';
import ensInfo from '../../helpers/ens.json';

import CopyIcon from '../../images/copy.svg';

const useStyles = makeStyles((theme) => ({
  bold: {
    fontWeight: 'bold',
  },
  statusWrapper: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'center',
    marginBottom: theme.spacing(2.5),
    '& > *:last-child:not(:first-child)': {
      marginTop: theme.spacing(1.25),
    }
  },
  statusProcessing: {
    fontSize: 14,
  },
  statusSuccess: {
    color: theme.palette.success.main,
  },
  statusError: {
    color: theme.palette.error.main,
  },
  statusInfo: {
    color: theme.palette.info.main,
  },
  statusIcon: {
    fontSize: 50,
  },
  verificationIcon: {
    display: 'inline-block',
    fontSize: 14,
    marginLeft: theme.spacing(0.5),
  },
  statusIconReadonly: {
    display: 'inline-block',
    fontSize: 14,
    marginRight: theme.spacing(0.5),
  },
  payoutSubheader: {
    fontSize: 16,
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'center',
    marginBottom: theme.spacing(1.25),
  },
  payoutRecipients: {
    fontSize: 42,
    fontWeight: 'normal',
    lineHeight: 1,
    textAlign: 'center',
    marginBottom: theme.spacing(1.25),
  },
  payoutDetails: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
    textAlign: 'center',
    borderTop: '1px solid #D3DEEC',
    paddingTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  payoutDetailsSmall: {
    paddingTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  checkboxLabel: {
    fontSize: 14,
  },
  payoutMethod: {
    margin: theme.spacing(2, 0),
  },
  payoutMethodLabel: {
    fontSize: 14,
    marginBottom: theme.spacing(1),
  },
  payoutMethodOption: {
    marginBottom: theme.spacing(0.75),
  },
  payoutMethodOptionInfo: {
    color: '#0000008a',
    fontSize: 12,
  },
  payoutMethodOptionRadio: {
    padding: theme.spacing(0.25, 1),
  },
  delegatedAddressWrapper: {
    marginBottom: theme.spacing(2.5),
  },
  delegatedAddressHeader: {
    color: '#0000008a',
    fontSize: 14,
    textAlign: 'left',
  },
  payoutDetailsHeader: {
    color: '#0000008a',
    fontSize: 14,
    marginBottom: theme.spacing(1),
  },
  delegatedAddress: {
    position: 'relative',
    textAlign: 'left',
    color: '#363636',
    padding: theme.spacing(0.5, 0),
    borderRadius: 10,
    cursor: 'pointer',
  },
  delegatedAddressBox: {
    border: `1px solid #D3DEEC`,
    padding: theme.spacing(0.5, 1.5),
    borderRadius: 10,
  },
  copyAction: {
    position: 'absolute',
    top: theme.spacing(1),
    right: 0,
    cursor: 'pointer',
  },
  copyActionBox: {
    right: theme.spacing(1.5),
  },
  copyIcon: {
    //verticalAlign: 'text-bottom',
    display: 'inline-block',
    marginLeft: theme.spacing(0.5),
    cursor: 'pointer',
  },
}));

export default ({payments, nextDialog, state, readonly, status}) => {
  const classes = useStyles();
  const dialogClasses = dialogStyles();

  const {screen, dialog, addresses, networks, walletAddresses, currency, stableCoin, contacts, openDialog, closeDialog, addNotification, getNetworkById, convertToCrypto, convertToPayableCrypto, convertPayableToDisplayValue, convertToFiat, getTransactions, updateHidePaymentNotice} = useContext(AppContext);

  const [processing, setProcessing] = useState(state && state.processing || false);
  const [sent, setSent] = useState(state && state.sent || false);
  const [paid, setPaid] = useState(state && state.paid || false);
  const [error, setError] = useState(state && state.error || null);
  const [balance, setBalance] = useState(state && state.balance || 0);
  const [paymentMethod, setPaymentMethod] = useState(state && state.paymentMethod || PAYMENT_OPTIONS.DEFAULT);
  const [delegatedAddress, setDelegatedAddress] = useState(state && state.delegatedAddress || null);
  const [aragonDaoName, setAragonDaoName] = useState(state && state.aragon && state.aragon.daoName || null);
  const [aragonDaoAddress, setAragonDaoAddress] = useState(state && state.aragon && state.aragon.daoAddress || null);
  const [aragonDaoApps, setAragonDaoApps] = useState(state && state.aragon && state.aragon.aragonDaoApps || null);
  const [aragonLoading, setAragonLoading] = useState(state && state.aragonLoading || false);
  const [aragonProcessing, setAragonProcessing] = useState(state && state.aragonProcessing || false);
  const [aragonError, setAragonError] = useState(state && state.aragonError || null);
  const [gnosisSafeAddress, setGnosisSafeAddress] = useState(state && state.gnosis && state.gnosis.safeAddress || null);
  const [gnosisSafeVersion, setGnosisSafeVersion] = useState(state && state.gnosis && state.gnosis.gnosisSafeVersion || null);
  const [gnosisLoading, setGnosisLoading] = useState(state && state.gnosisLoading || false);
  const [gnosisError, setGnosisError] = useState(state && state.gnosisError || null);
  const [gnosisProcessing, setGnosisProcessing] = useState(state && state.gnosisProcessing || false);

  const debouncedAragonDaoName = useDebounce(aragonDaoName, 250);
  const debouncedGnosisSafeAddress = useDebounce(gnosisSafeAddress, 250);

  const address = addresses && addresses[0] || '', // TODO: @david Remove this || '0x7037f30B4F542ca66c06D377f79c6140947f49b1' || '0x5c1D926f62B61C9cf62167474111385ff7393c61'
    networkId = networks && networks[0] || null, // TODO: @david Remove this || 4 || 1666700000
    network = getNetworkById(networkId),
    fiatTotal = getPaymentsTotal(payments),
    cryptoTotal = convertToCrypto(fiatTotal),
    numRecipients = (payments || []).length,
    cryptoBalance = convertPayableToDisplayValue(balance || 0),
    fiatBalance = convertToFiat(cryptoBalance),
    smartWalletAddress = networkId && walletAddresses && walletAddresses[networkId] || null,
    ERROR_PAYMENT_FAILED = `Failed to pay ${numRecipients} recipient${numRecipients === 1 ? '' : 's'}`;

  const smartWalletBalance = useSmartWalletBalance(smartWalletAddress, networkId, currency);
  const smartWalletFiatBalance = new Decimal(smartWalletBalance && smartWalletBalance[FIAT_CURRENCIES.USD] || 0).toFixed(2);

  const isNormalWalletPayment = paymentMethod === PAYMENT_OPTIONS.DEFAULT;
  const isSmartWalletPayment = [PAYMENT_OPTIONS.SMART_WALLET, PAYMENT_OPTIONS.SMART].includes(paymentMethod);
  const isDelegatedPayment = [
    PAYMENT_OPTIONS.DELEGATED_TRANSFER, PAYMENT_OPTIONS.ARAGON, PAYMENT_OPTIONS.GNOSIS,
    PAYMENT_OPTIONS.DAO
  ].includes(paymentMethod);
  const isAragonPayment = paymentMethod === PAYMENT_OPTIONS.ARAGON;
  const isGnosisPayment = paymentMethod === PAYMENT_OPTIONS.GNOSIS;

  const paymentMethodFiatBalance = isSmartWalletPayment?smartWalletFiatBalance:fiatBalance;
  const paymentMethodCryptoBalance = isSmartWalletPayment?(smartWalletBalance && currency && smartWalletBalance[currency] || 0):cryptoBalance;

  const ipfs = useMemo(() => {
    return gStorage.ipfs(IPFS_URL);
  }, []);

  const saveInspectorMetadata = data => {
    ipfs.BatchPayment.add(data).catch(e => {
      console.error('saveInspectorMetadata:', data, e);
    });
  };

  useEffect(() => {
    if (address) {
      makeBackgroundRequest(TASKS.GET_BALANCE, {address}).then(balance => {
        setBalance(balance);
      }).catch(() => {
      });
    }
  }, [address, networkId]);

  useEffect(() => {
    if ((paid || error) && processing) {
      setProcessing(false);
    }
  }, [paid, error]);

  const listenForTransactionEvents = transactionHash => {
    listenForExtensionNotification([
      NOTIFICATIONS.PAYOUT_INITIATED,
      NOTIFICATIONS.PAYOUT_COMPLETED,
      NOTIFICATIONS.PAYOUT_FAILED
    ], (event, payload) => {
      if (payload && transactionHash === payload.hash) {
        switch (event) {
          case NOTIFICATIONS.PAYOUT_COMPLETED: {
            let inspector = {
              ...(payload.inspector || {}),
              ...(payload.delegatedAddress?{
                batchAddress: payload.delegatedAddress,
              }:{}),
              transactionHash: payload.hash,
            };

            if(payload.paymentMethod === PAYMENT_OPTIONS.ARAGON && payload.delegatedAddress && payload.aragon && payload.aragon.apps) {
              // Initiate Aragon withdraw
              setDelegatedAddress(payload.delegatedAddress);
              setAragonProcessing(true);

              initiateAragonWithdraw(
                payload.delegatedAddress,
                convertToPayableCrypto(cryptoTotal),
                getBatchSummary(payload.delegatedAddress) || '',
                payload.aragon.apps,
                address,
                hash => {
                  updateTransaction(payload.hash, {
                    aragonHash: hash,
                    aragonConfirmed: false,
                  });
                }, (receipt, confirmationNumber) => {
                  if(aragonProcessing) {
                    setAragonProcessing(false);
                  }
                  if(!paid) {
                    setPaid(true);
                  }

                  if(receipt && receipt.transactionHash) {
                    updateTransaction(payload.hash, {
                      aragonHash: receipt.transactionHash,
                      aragonConfirmed: true,
                    });
                  }

                  saveInspectorMetadata({
                    ...inspector,
                    paymentMethodInfo: {
                      ...(inspector.paymentMethodInfo || {}),
                      ...(receipt && receipt.transactionHash?{
                        transactionHash: receipt.transactionHash,
                      }:{}),
                    },
                  });

                  if(!confirmationNumber) {
                    addNotification(`Aragon withdrawal initiated: $${fiatTotal} to ${numRecipients} recipient${numRecipients === 1 ? '' : 's'}`);
                  }
                }, (error, receipt) => {
                  console.error('aragon withdraw error: ', error);
                  setAragonProcessing(false);
                  setPaid(false);
                  setError(ERROR_MESSAGES.ARAGON_WITHDRAWAL_FAILED);
              });
            } else if(payload.paymentMethod === PAYMENT_OPTIONS.GNOSIS && payload.delegatedAddress && payload.gnosis && payload.gnosis.safeAddress) {
              // Initiate Gnosis withdraw
              setDelegatedAddress(payload.delegatedAddress);
              setGnosisProcessing(true);

              initiateGnosisWithdraw(
                payload.delegatedAddress,
                convertToPayableCrypto(cryptoTotal),
                EMPTY_HEX_DATA,
                GNOSIS_OPERATIONS.CALL,
                payload.gnosis.safeAddress,
                payload.gnosis.version,
                getBatchSummary(payload.delegatedAddress) || '',
                address,
                networkId,
                () => {
                  updateTransaction(payload.hash, {
                    gnosisConfirmed: false,
                  });
                }, (res) => {
                  if(gnosisProcessing) {
                    setGnosisProcessing(false);
                  }
                  if(!paid) {
                    setPaid(true);
                  }

                  updateTransaction(payload.hash, {
                    gnosisInitiated: true,
                  });

                  saveInspectorMetadata({
                    ...inspector,
                    paymentMethodInfo: {
                      ...(inspector.paymentMethodInfo || {}),
                      ...(res && res.contractTransactionHash?{
                        transactionHash: res.contractTransactionHash,
                      }:{}),
                    },
                  });

                  addNotification(`Gnosis safe withdrawal initiated: $${fiatTotal} to ${numRecipients} recipient${numRecipients === 1 ? '' : 's'}`);
                }, (error) => {
                  console.error('gnosis withdraw error: ', error);
                  setGnosisProcessing(false);
                  setPaid(false);
                  setError(ERROR_MESSAGES.GNOSIS_WITHDRAWAL_FAILED);
                }).catch(() => {});
            } else {
              setPaid(true);
              if(payload.delegatedAddress) {
                setDelegatedAddress(payload.delegatedAddress);
              }
              saveInspectorMetadata(inspector);

              addNotification(`${payload.delegatedAddress?'Smart address created':'Payment completed'}: $${fiatTotal} to ${numRecipients} recipient${numRecipients === 1 ? '' : 's'}`);
            }
            break;
          }
          case NOTIFICATIONS.PAYOUT_FAILED: {
            setError(payload.message || ERROR_PAYMENT_FAILED);
            break;
          }
          default: {
            break;
          }
        }

        // Refresh transactions
        getTransactions().catch(() => {});
      }
    });
  };

  useEffect(() => {
    if (state && state.hash) {
      if (!state.paid || !state.error) {
        // Listen for events on resume
        listenForTransactionEvents(state.hash);
      }
    }

    if(!readonly) {
      // Get Aragon dao info
      sendContentRequest(ACTIONS.GET_ACTIVE_ARAGON_DAO_INFO).then(res => {
        if(res && res.daoName) {
          setAragonDaoName(res.daoName);
        }
      }).catch(() => {});

      // Get Gnosis safe info
      sendContentRequest(ACTIONS.GET_ACTIVE_GNOSIS_SAFE_INFO).then(res => {
        if(res && res.safeAddress) {
          setGnosisSafeAddress(res.safeAddress);
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setAragonDaoAddress(null);
    setAragonLoading(!!(aragonDaoName && address && networkId));
    setAragonError(null);
  }, [aragonDaoName, address, networkId]);

  useEffect(() => {
    if(isAragonPayment && debouncedAragonDaoName && networkId && address) {
      setAragonLoading(true);
      setAragonError(null);
      const web3 = createWeb3();
      const daoDomain = `${debouncedAragonDaoName}${ARAGON_APP_ENS_SUFFIX}`;
      // Set registry for network if none is set
      if(!web3.eth.ens.registryAddress && ensInfo[networkId]) {
        web3.eth.ens.registryAddress = ensInfo[networkId];
      }

      web3.eth.ens.getAddress(daoDomain).then(function (daoAddress) {
        if(daoAddress) {
          setAragonDaoAddress(daoAddress);
          getAragonApps(daoAddress, networkId).then(apps => {
            if(apps && apps[ARAGON_APP_NAME.TOKEN_MANAGER] && apps[ARAGON_APP_NAME.VOTING] && apps[ARAGON_APP_NAME.FINANCE]) {
              setAragonDaoApps(apps);
              canForwardAragonScript(address, apps).then(() => {
                setAragonLoading(false);
                setAragonError(null);
              }).catch(e => {
                setAragonLoading(false);
                setAragonError(
                  ERROR_MESSAGES.ARAGON_PERMISSIONS_FAILED.replace('{address}', truncateAddress(address))
                );
              });
            } else {
              setAragonLoading(false);
              setAragonError(ERROR_MESSAGES.ARAGON_INITIALIZATION_FAILED);
            }
          }).catch(e => {
            console.error('aragon apps error: ', e);
            setAragonLoading(false);
            setAragonError(ERROR_MESSAGES.ARAGON_INITIALIZATION_FAILED);
          });
        } else {
          setAragonLoading(false);
          setAragonError(ERROR_MESSAGES.ARAGON_ENS_FAILED);
        }
      }).catch(e => {
        setAragonDaoAddress(null);
        setAragonLoading(false);
        setAragonError(`There's no DAO associated with ${daoDomain} on ${network && (network.name || network.chain || 'this network')}`);
      });
    }
  }, [debouncedAragonDaoName, paymentMethod, address, networkId]);

  useEffect(() => {
    setGnosisSafeVersion(null);
    setGnosisLoading(!!(gnosisSafeAddress && address && networkId));
    setGnosisError(null);
  }, [gnosisSafeAddress, address, networkId]);

  useEffect(() => {
    if(isGnosisPayment && debouncedGnosisSafeAddress && networkId && address) {
      setGnosisLoading(true);
      setGnosisError(null);

      getGnosisSafeInfo(debouncedGnosisSafeAddress, networkId).then(safeInfo =>  {
        if(safeInfo && safeInfo.version) {
          setGnosisSafeVersion(safeInfo.version);
          setGnosisLoading(false);
        } else {
          setGnosisLoading(false);
          setGnosisError('Failed to retrieve the Gnosis safe');
        }
      }).catch(e => {
        setGnosisSafeVersion(null);
        setGnosisLoading(false);
        setGnosisError(`${truncateAddress(gnosisSafeAddress)} is not valid Gnosis safe on ${network && (network.name || network.chain || 'this network')}`);
      });
    }
  }, [debouncedGnosisSafeAddress, paymentMethod, address, networkId]);

  const onPay = () => {
    setProcessing(true);
    setSent(false);
    setPaid(false);
    setError(null);

    let paymentPayload = null,
      paymentError = null;

    if (address) {
      if (payments.length > 0) {
        // Compose multiple payment payload
        let abi = null,
          contractAddress = null,
          stableCoinAddress = null,
          stableCoinDecimals = null;

        if(isSmartWalletPayment) {
          const contractDetails = contractsInfo && contractsInfo.wallet && contractsInfo.wallet[networkId];
          abi = contractDetails && contractDetails.abi;
          contractAddress = smartWalletAddress;
          const stableCoinSymbol = stableCoin && stableCoin.symbol || null;
          if(stableCoinSymbol && contractsInfo && contractsInfo.token && contractsInfo.token[stableCoinSymbol]) {
            const { chains :stableCoinChains, decimals } =  contractsInfo.token[stableCoinSymbol] || {};
            if(stableCoinChains && stableCoinChains[networkId] && Web3.utils.isAddress(stableCoinChains[networkId])) {
              stableCoinAddress = stableCoinChains[networkId];
            }
            if(decimals) {
              stableCoinDecimals = decimals;
            }
          }
        } else if(isNormalWalletPayment) {
          const contractDetails = contractsInfo && contractsInfo.batch && contractsInfo.batch[networkId];
          abi = contractDetails && contractDetails.abi;
          contractAddress = contractDetails && contractDetails.address;
        }

        if (isDelegatedPayment || (
          abi && contractAddress && (isNormalWalletPayment || stableCoinAddress)
        )) {
          let isMultiTokenContract = isDelegatedPayment,
            isMultiTokenIndexBasedContract = false;

          if(!isDelegatedPayment) {
            const abiBatchTransfer = (abi || []).find(i => i.name === 'batchTransfer');
            const abiPayout = (abi || []).find(i => i.name === 'payout');
            const abiBatchTransferArgs = (abiBatchTransfer && abiBatchTransfer.inputs || []).map(i => i.name) || (abiPayout && abiPayout.inputs || []).map(i => i.name) || [];

            isMultiTokenContract = abiBatchTransferArgs.includes('tokenAddresses');
            isMultiTokenIndexBasedContract = (
              abiBatchTransferArgs.includes('tokenAddressIndices') ||
              abiBatchTransferArgs.includes('tokenPointers') // legacy name for tokenAddressIndices
            ) && isMultiTokenContract;
          }

          let cryptoValueTotal = convertToPayableCrypto(fiatTotal),
            recipients = [],
            rawValues = [],
            values = [],
            tokenPointers = [],
            tokenAddresses = [],
            multiSend = [],
            inspectorPayments = [];

          const convertToPayableStableCoinValue = amount => {
            return new Decimal(10).pow(stableCoinDecimals || 18).times(amount || 0).toFixed(0);
          };

          for (const payment of (payments || [])) {
            const to = payment && payment.address || null,
              fiatAmount = payment && payment.amount || null,
              cryptoValue = fiatAmount && (isSmartWalletPayment?convertToPayableStableCoinValue(fiatAmount):convertToPayableCrypto(fiatAmount)) || null;

            recipients.push(to);
            rawValues.push(cryptoValue);
            values.push(Web3.utils.toHex(cryptoValue));

            const contact = payment.contact || getPaymentContact(payment, contacts);

            inspectorPayments.push({
              recipient: {
                address: to,
                name: contact && contact.name || payment.name,
              },
              value: cryptoValue,
              paymentCurrency: currency,
              amount: payment.inputCurrency === FIAT_CURRENCIES.USD?payment.amount:payment.value,
              currency: payment.inputCurrency,
              note: payment.details,
              dueDate: payment.due_date,
              createdAt: payment.created_at,
            });

            if (isMultiTokenIndexBasedContract) {
              tokenPointers.push(Web3.utils.toHex(isSmartWalletPayment?1:0));
            } else if(isMultiTokenContract) {
              tokenAddresses.push(isSmartWalletPayment?stableCoinAddress:ADDRESS_ZERO);
            }

            if(isGnosisPayment) {
              multiSend.push({
                to,
                value: cryptoValue,
                data: EMPTY_HEX_DATA, // TODO: @david Enable ERC20 transfers
              });
            }
          }

          if(isSmartWalletPayment && isMultiTokenIndexBasedContract) {
            tokenAddresses.push(stableCoinAddress);
          }

          let batchTransferArguments = [recipients, values];
          if (isMultiTokenContract) {
            batchTransferArguments = batchTransferArguments.concat([
              ...(isMultiTokenIndexBasedContract?[
                tokenPointers,
              ]:[]),
              tokenAddresses
            ]);
          }

          const inspectorPaymentMethodMap = {
            [PAYMENT_OPTIONS.DEFAULT]: 'wallet',
            [PAYMENT_OPTIONS.SMART_WALLET]: 'smart-wallet',
            [PAYMENT_OPTIONS.SMART]: 'smart-wallet',
            [PAYMENT_OPTIONS.DELEGATED_TRANSFER]: 'batch-address',
            [PAYMENT_OPTIONS.DAO]: 'batch-address',
            [PAYMENT_OPTIONS.ARAGON]: PAYMENT_OPTIONS.ARAGON,
            [PAYMENT_OPTIONS.GNOSIS]: PAYMENT_OPTIONS.GNOSIS,
          };

          const aragonMetadata = isAragonPayment?{
            daoName: aragonDaoName,
            daoAddress: aragonDaoAddress,
            apps: aragonDaoApps,
          }:null;
          const gnosisMetadata = isGnosisPayment?{
            safeAddress: gnosisSafeAddress,
            version: gnosisSafeVersion,
          }:null;

          paymentPayload = {
            from: address,
            value: Web3.utils.toHex(cryptoValueTotal),
            ...(isDelegatedPayment?{}:{
              abi,
              contractAddress,
            }),
            data: batchTransferArguments,
            meta: {
              from: address,
              ...(isDelegatedPayment?{}:{
                to: contractAddress,
              }),
              value: cryptoValueTotal,
              chain: networkId,
              currency,
              recipients,
              values: rawValues,
              payments,
              paymentMethod,
              ...(isAragonPayment?{
                aragon: aragonMetadata
              }:{}),
              ...(isGnosisPayment?{
                gnosis: gnosisMetadata
              }:{}),
            },
            snapshot: {
              screen,
              dialog
            },
            paymentMethod,
            multiSend,
            inspector: {
              payments: inspectorPayments,
              paymentMethod: inspectorPaymentMethodMap[paymentMethod] || paymentMethod,
              ...(aragonMetadata || gnosisMetadata?{
                paymentMethodInfo: aragonMetadata || gnosisMetadata,
              }:{}),
              creator: {
                address,
              }
            }
          };
        } else {
          paymentError = isSmartWalletPayment?ERROR_MESSAGES.SMART_WALLET_PAYMENT_FAILED:ERROR_MESSAGES.NETWORK_BATCH_NOT_SUPPORTED;
        }
      }
    } else {
      paymentError = ERROR_MESSAGES.METAMASK_AUTH_REQUIRED;
    }

    if (paymentPayload) {
      if(isGnosisPayment && paymentPayload.multiSend && Array.isArray(paymentPayload.multiSend)) {
        const gnosisRecipient = getMultiSendContractAddress(networkId);
        const gnosisData = encodeMultiSendCall(paymentPayload.multiSend, networkId);

        if(gnosisRecipient && gnosisData) {
          const paidAt = moment.utc().format();

          // Initiate Gnosis withdraw
          setGnosisProcessing(true);

          initiateGnosisWithdraw(
            gnosisRecipient,
            0,
            gnosisData,
            GNOSIS_OPERATIONS.DELEGATE,
            gnosisSafeAddress,
            gnosisSafeVersion,
            getBatchSummary() || '',
            address,
            networkId,
            () => {
            }, (res) => {
              setProcessing(false);
              setGnosisProcessing(false);
              setPaid(true);

              if(res && res.contractTransactionHash) {
                saveTransaction({
                  ...(paymentPayload.meta || {}),
                  hash: res.contractTransactionHash,
                  confirmed: true,
                  delegated: isDelegatedPayment,
                  paymentMethod,
                  paid_at: paidAt,
                  gnosisInitiated: true,
                  gnosisMultiSend: true,
                }).then(() => {
                  // Refresh transactions
                  getTransactions().catch(() => {});
                }).catch(() => {});
              }

              if(paymentPayload.inspector) {
                saveInspectorMetadata({
                  ...paymentPayload.inspector,
                  ...(res && res.contractTransactionHash?{
                    transactionHash: res.contractTransactionHash,
                  }:{}),
                  createdAt: paidAt,
                });
              }

              addNotification(`Gnosis safe withdrawal initiated: $${fiatTotal} to ${numRecipients} recipient${numRecipients === 1 ? '' : 's'}`);
            }, (error) => {
              console.error('gnosis withdraw error: ', error);
              setProcessing(false);
              setGnosisProcessing(false);
              setPaid(false);
              setError(ERROR_MESSAGES.GNOSIS_WITHDRAWAL_FAILED);
            }).catch(() => {});
          return ;
        }
      }

      makeBackgroundRequest(TASKS.MAKE_PAYOUT, paymentPayload).then(hash => {
        if (hash) {
          setSent(true);
          // Refresh transactions
          getTransactions().catch(() => {
          });

          listenForTransactionEvents(hash);
        } else {
          setError(ERROR_PAYMENT_FAILED);
        }
      }).catch(e => {
        setError((e && typeof e === 'string' && e) || ERROR_PAYMENT_FAILED);
      });
    } else {
      setError(paymentError || ERROR_PAYMENT_FAILED)
    }
  };

  const getRecipientsSummary = () => {
    let details = ['Recipients:'];
    for (const [idx, payment] of (payments || []).entries()) {
      const contact = payment.contact || getPaymentContact(payment, contacts);
      details.push(
        `${idx+1}. ${payment.address}/ ${contact && contact.name || payment.name} - ${convertToCrypto(payment.amount)} ${currency || 'ETH'}/ $${payment.amount}`
      );
    }
    return details.join('\n');
  };

  const getBatchSummary = batchAddress => {
    return [
      ...(batchAddress?[
        'Batch Address:', batchAddress
      ]:[]),
      getRecipientsSummary(),
    ].filter(Boolean).join('\n');
  };

  return (
    <Dialog title="Payout Details"
            ariaLabel="payout details"
            actions={(
              <div className={dialogClasses.dialogActionsGrid}>
                <Grid container
                      direction="row"
                      justify="space-between"
                      wrap="nowrap">
                  <Button type="button"
                          color="primary"
                          variant="outlined"
                          disabled={processing && !sent}
                          onClick={() => {
                            if (nextDialog) {
                              openDialog(nextDialog);
                            } else {
                              closeDialog();
                            }
                          }}>
                    {(paid || sent || readonly) && 'Close' || 'Cancel'}
                  </Button>
                  {!readonly && (
                    <Button type="button"
                            color="primary"
                            variant="contained"
                            disabled={!address || paid || processing || new Decimal(cryptoTotal).gt(cryptoBalance) || (isAragonPayment && aragonLoading)}
                            onClick={onPay}>
                      {isDelegatedPayment?(isAragonPayment?'Request':'Create'):'Pay'}
                    </Button>
                  ) || null}
                </Grid>
              </div>
            )}>

      {((processing || paid || error) && !readonly) && (
        <div className={clsx(classes.statusWrapper, {
          [classes.statusProcessing]: processing && sent,
          [classes.statusSuccess]: paid,
          [classes.statusError]: error,
        })}>
          {processing && (
            <>
              <CircularProgress size={sent ? 32 : 42} color="secondary"/>
              <div>
                {sent && (
                  <>
                    <div>
                      {isDelegatedPayment && !aragonProcessing && !gnosisProcessing?'A smart address is being created.':'Your transaction is processing.'}
                    </div>

                    {(isAragonPayment && !aragonProcessing) && (
                      <>
                        <div>You'll be prompted to sign another transaction to request a withdrawal from the DAO.</div>
                        <div>This might take several minutes.</div>
                      </>
                    ) || (
                      (isGnosisPayment && !gnosisProcessing) && (
                        <>
                          <div>You'll be prompted to sign the Gnosis safe withdrawal data.</div>
                          <div>This might take several minutes.</div>
                        </>
                      ) || (
                        <>
                          <div>This might take several minutes.</div>
                          <div>You can close this dialog below and continue using the app in the meantime.</div>
                        </>
                      )
                    )}
                  </>
                ) || (
                  <>{isDelegatedPayment?(isGnosisPayment?'Initiating withdrawal':'Initializing smart address'):'Initiating payment'} ...</>
                )}
              </div>
            </>
          ) || (
            paid?(
              <>
                <CheckCircleIcon className={classes.statusIcon}/>
                <div>
                  {isDelegatedPayment?
                    (
                      isGnosisPayment?'Gnosis Safe withdrawal initiated.': (
                        isAragonPayment?'Smart address created and Aragon withdrawal initiated.':
                        `Smart address created successfully.`
                      )
                    ):
                    `Paid ${numRecipients} recipient${numRecipients === 1 ? '' : 's'}`
                  }
                </div>

                {(isDelegatedPayment && delegatedAddress)?(
                  <Copy text={delegatedAddress}>
                    <div className={clsx(classes.delegatedAddress, classes.delegatedAddressBox)}>
                      {truncateAddress(delegatedAddress, 16, 4)}

                      <div className={clsx(classes.copyAction, classes.copyActionBox)}>
                        <img src={CopyIcon} className={classes.copyIcon}/>
                      </div>
                    </div>
                  </Copy>
                ):null}
              </>
            ):(
              <>
                <CancelIcon className={classes.statusIcon}/>
                <div>{error || ERROR_PAYMENT_FAILED}</div>
              </>
            )
          )}
        </div>
      ) || (
        <>
          <div className={classes.payoutSubheader}>
            Total Recipients
          </div>
          <div className={classes.payoutRecipients}>
            {numRecipients}
          </div>
        </>
      )}

      {(!readonly) && (
        <FormControl component="fieldset"
                     className={classes.payoutMethod}
                     disabled={processing || sent || paid}>
          <FormLabel component="legend"
                     className={classes.payoutMethodLabel}>Payment Method</FormLabel>
          <RadioGroup
            aria-label="gender"
            name="controlled-radio-buttons-group"
            value={paymentMethod}
            onChange={e => {
              setPaymentMethod(e.target.value);
            }}
          >
            {Object.keys(PAYMENT_OPTIONS).map(key => {
              const value = PAYMENT_OPTIONS[key],
                label = PAYMENT_OPTIONS_LABELS[value] || value;

              if(LEGACY_AND_DISABLED_PAYMENT_OPTIONS.includes(value)) return null;
              if(paid && value !== paymentMethod) return null;

              return (
                <>
                  <FormControlLabel value={value}
                                    className={classes.payoutMethodOption}
                                    control={<Radio className={classes.payoutMethodOptionRadio}/>}
                                    label={(
                                      <div>
                                        <div>{label}</div>
                                        {(value === PAYMENT_OPTIONS.DEFAULT && address) && (
                                          <div className={classes.payoutMethodOptionInfo}>
                                            {truncateAddress(address)}
                                          </div>
                                        ) || null}

                                        {([PAYMENT_OPTIONS.SMART_WALLET, PAYMENT_OPTIONS.SMART].includes(value) && smartWalletAddress) && (
                                          <div className={classes.payoutMethodOptionInfo}>
                                            {truncateAddress(smartWalletAddress)}
                                          </div>
                                        ) || null}
                                      </div>
                                    )} />
                </>
              );
            })}
          </RadioGroup>

          {isAragonPayment && (
            <TextField label="Aragon DAO Name"
                       type="text"
                       value={aragonDaoName || ''}
                       placeholder="Aragon Dao Name"
                       required={true}
                       error={aragonError || ''}
                       helperText={aragonError || ''}
                       onChange={e => setAragonDaoName(e.target.value)}
                       disabled={processing || sent || paid}
                       InputProps={{
                         inputProps: {
                           pattern: '^\\w+$',
                         },
                         endAdornment: (
                           <InputAdornment position="end">
                             {ARAGON_APP_ENS_SUFFIX}
                             {aragonLoading && (
                               <CircularProgress size={12}
                                                 color="secondary"
                                                 className={classes.verificationIcon}/>
                             ) || (
                               aragonError && (
                                 <CancelIcon className={clsx(classes.verificationIcon, classes.statusError)}/>
                               ) || (
                                 aragonDaoAddress && (
                                   <CheckCircleIcon className={clsx(classes.verificationIcon, classes.statusSuccess)}/>
                                 ) || null
                               )
                             )}
                           </InputAdornment>
                         ),
                       }}/>
          ) || null}

          {isGnosisPayment && (
            <TextField label="Gnosis Safe Address"
                       type="text"
                       value={gnosisSafeAddress || ''}
                       placeholder="Gnosis Safe Address"
                       required={true}
                       error={gnosisError || ''}
                       helperText={gnosisError || ''}
                       onChange={e => setGnosisSafeAddress(e.target.value)}
                       disabled={processing || sent || paid}
                       InputProps={{
                         inputProps: {
                           pattern: '^0x\\w{40}$',
                         },
                         endAdornment: (
                           <InputAdornment position="end">
                             {gnosisLoading && (
                               <CircularProgress size={12}
                                                 color="secondary"
                                                 className={classes.verificationIcon}/>
                             ) || (
                               gnosisError && (
                                 <CancelIcon className={clsx(classes.verificationIcon, classes.statusError)}/>
                               ) || (
                                 gnosisSafeVersion && (
                                   <CheckCircleIcon className={clsx(classes.verificationIcon, classes.statusSuccess)}/>
                                 ) || null
                               )
                             )}
                           </InputAdornment>
                         ),
                       }}/>
          ) || null}

          <FormHelperText>
            {PAYMENT_OPTIONS_DESCRIPTION[paymentMethod]
              .replace('{balance}', `${paymentMethodCryptoBalance} ${currency || 'ETH'}`)
              .replace('{amount}', `${cryptoTotal} ${currency || 'ETH'}`)}
          </FormHelperText>
        </FormControl>
      ) || null}

      {(readonly && isDelegatedPayment && delegatedAddress) && (
        <div className={classes.delegatedAddressWrapper}>
          <div className={classes.delegatedAddressHeader}>Smart Address</div>

          <Copy text={delegatedAddress}>
            <div className={classes.delegatedAddress}>
              {truncateAddress(delegatedAddress, 16, 4)}

              <div className={classes.copyAction}>
                <img src={CopyIcon} className={classes.copyIcon}/>
              </div>
            </div>
          </Copy>
        </div>
      ) || null}

      {(readonly && isAragonPayment && aragonDaoName) && (
        <div className={classes.delegatedAddressWrapper}>
          <div className={classes.delegatedAddressHeader}>Aragon DAO</div>
          <div>
            <a href={`https://client.aragon.org/#/${aragonDaoName}/`} target="_blank">{`${aragonDaoName}${ARAGON_APP_ENS_SUFFIX}`}</a>
          </div>
        </div>
      ) || null}

      {(readonly && isGnosisPayment && gnosisSafeAddress) && (
        <div className={classes.delegatedAddressWrapper}>
          <div className={classes.delegatedAddressHeader}>Gnosis Safe Address</div>

          <Copy text={gnosisSafeAddress}>
            <div className={classes.delegatedAddress}>
              {truncateAddress(gnosisSafeAddress, 16, 4)}

              <div className={classes.copyAction}>
                <img src={CopyIcon} className={classes.copyIcon}/>
              </div>
            </div>
          </Copy>
        </div>
      ) || null}

      {(readonly && status) && (
        <div className={classes.delegatedAddressWrapper}>
          <div className={classes.delegatedAddressHeader}>Status</div>
          <div>
            {((status || '').toLowerCase() === 'paid') && (
              <CheckCircleIcon className={clsx(classes.statusIconReadonly, classes.statusSuccess)}
                               style={{fontSize: '16px', verticalAlign: 'middle'}}/>
            ) || (
              <CircularProgress size={12}
                                color="secondary"
                                className={classes.statusIconReadonly}/>
            )} {status}
          </div>
        </div>
      ) || null}

      {(paid || readonly) && (
        <div>
          <Grid container
                direction="row"
                justify="space-between"
                wrap="nowrap"
                className={classes.payoutDetailsHeader}>
            <div>Recipients</div>

            <Copy text={getRecipientsSummary()}>
              <img src={CopyIcon} className={classes.copyIcon}/>
            </Copy>
          </Grid>
          {(payments || []).map((payment, idx) => {
            const contact = payment.contact || getPaymentContact(payment, contacts);
            return (
              <Grid container
                    direction="row"
                    justify="space-between"
                    wrap="nowrap"
                    className={clsx(classes.payoutDetails, classes.payoutDetailsSmall)}>
                <div style={{textAlign: 'left'}}>
                  <div>{contact && contact.name || payment.name}</div>
                  <div>{truncateAddress(payment.address)}</div>
                </div>
                <div className={classes.bold} style={{textAlign: 'right'}}>
                  <div>${payment.amount}</div>
                  {(currency && (isNormalWalletPayment || isDelegatedPayment)) && (
                    <div>{convertToCrypto(payment.amount)}{' '}{currency}</div>
                  ) || null}
                </div>
              </Grid>
            );
          })}
        </div>
      ) || null}

      <Grid container
            direction="row"
            justify="space-between"
            wrap="nowrap"
            className={classes.payoutDetails}>
        <div>Total</div>
        <div className={classes.bold} style={{textAlign: 'right'}}>
          <div>${fiatTotal}</div>
          {(currency && (isNormalWalletPayment || isDelegatedPayment)) && (
            <div>
              {cryptoTotal}{' '}{currency}

              {isDelegatedPayment && (
                <Copy text={cryptoTotal}>
                  <img src={CopyIcon} className={classes.copyIcon}/>
                </Copy>
              ) || null}
            </div>
          ) || null}
        </div>
      </Grid>

      {((isNormalWalletPayment || isSmartWalletPayment) && !readonly) && (
        <Grid container
              direction="row"
              justify="space-between"
              wrap="nowrap"
              className={classes.payoutDetails}>
          <div>Balance</div>
          <div className={classes.bold} style={{textAlign: 'right'}}>
            <div>${paymentMethodFiatBalance}</div>
            {(currency && isNormalWalletPayment) && (
              <div>{paymentMethodFiatBalance}{' '}{currency}</div>
            ) || null}
          </div>
        </Grid>
      ) || null}
    </Dialog>
  );
};