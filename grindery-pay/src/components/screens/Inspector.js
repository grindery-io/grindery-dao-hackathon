import React, {useContext, useEffect, useMemo, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Avatar,
  Card,
  CardContent,
  CircularProgress,
  Grid,
} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import Web3 from 'web3';

import SearchBox from '../shared/SearchBox';

import AppContext from '../../AppContext';


import {createWeb3} from '../../helpers/metamask';
import {EVENT_NAMES, EVENT_SIGNATURES} from '../../helpers/contants';
import {cardStyles} from '../../helpers/style';
import {ERROR_MESSAGES} from '../../helpers/errors';

import useDebounce from '../../hooks/useDebounce';

import Copy from '../shared/Copy';

import {getInitials, getPaymentsTotal, truncateAddress} from '../../helpers/utils';
import {getSafeTransactionByHash} from '../../helpers/gnosis';

import contractsInfo from '../../helpers/contracts.json';
import {getBatchPaymentInfo} from "../../helpers/meta";

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  content: {
    padding: theme.spacing(2.5, 2, 2),
  },
  searchBox: {
    marginBottom: theme.spacing(2),
  },
  bold: {
    fontWeight: 'bold',
  },
  light: {
    fontSize: 12,
    opacity: 0.4,
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  transaction: {
    marginBottom: theme.spacing(2.5),
  },
  transactionHeader: {
    padding: theme.spacing(0, 0.5),
    marginBottom: theme.spacing(1),
  },
  transactionAmounts: {
    lineHeight: 1,
    '& > *': {
      display: 'inline-block',
    },
    '& > *:not(:last-child)': {
      paddingRight: theme.spacing(1),
      marginRight: theme.spacing(1),
      borderRight: `1px solid ${theme.palette.common.black}`,
    }
  },
  section: {
    marginBottom: theme.spacing(2),
  }
}));

export default () => {
  const classes = useStyles();
  const cardClasses = cardStyles();

  const {metaQuery, contacts, networks, currency, rate, setMetaQuery, convertPayableToDisplayValue, convertToFiat, syncDataAndRefresh} = useContext(AppContext);

  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);

  const web3 = useMemo(createWeb3, []);

  const networkId = networks && networks[0] || null; // TODO: @david Remove this

  useEffect(() => {
    setLoading(true);
    setError(null);

    syncDataAndRefresh().then(() => {
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(ERROR_MESSAGES.READ_PAYMENTS_FAILED);
    });
  }, []);

  const debouncedSearch = useDebounce(search, 250);

  useEffect(() => {
    setError(null);
  }, [search]);

  useEffect(() => {
    if(metaQuery && metaQuery !== search) {
      setSearch(metaQuery);
      setMetaQuery(null);
    }
  }, [metaQuery]);

  useEffect(() => {
    getMetaPaymentDetails(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    if(details && Array.isArray(details.recipients) && details.recipients.length) {
      const recipients = (details.recipients || []).map(recipient => ({
        ...recipient,
        amount: recipient.amount,
        fiatAmount: convertToFiat(convertPayableToDisplayValue(recipient.amount)),
        cryptoAmount: convertPayableToDisplayValue(recipient.amount),
      }));
      const total = getPaymentsTotal(recipients);
      setDetails({
        ...details,
        recipients,
        total: {
          amount: total,
          fiatAmount: convertToFiat(convertPayableToDisplayValue(total)),
          cryptoAmount: convertPayableToDisplayValue(total),
        }
      });
    }
  }, [currency, rate]);

  const getContactName = address => {
    const contact = (contacts || []).find(i => i.address === address);
    return contact && contact.name || 'Unknown';
  };

  const getMetaPaymentDetails = id => {
    setLoading(true);
    setDetails(null);
    setError(null);

    const fallback = (id) => {
      if(Web3.utils.isAddress(id)) {
        getSmartAddressPaymentDetails(id);
      } else if((id || '').length === 66 && /0x/.test(id)) {
        getGnosisSafeTransaction(id);
      } else if(id) {
        setError(ERROR_MESSAGES.INVALID_SMART_ADDRESS_OR_SAFE_HASH);
      } else {
        setError(null);
      }
    };

    getBatchPaymentInfo(id).then(res => {
      if(res && res.recipients && res.recipients.length) {
        const recipients = (res.recipients || []).map(recipient => ({
          ...recipient,
          amount: recipient.amount,
          fiatAmount: convertToFiat(convertPayableToDisplayValue(recipient.amount)),
          cryptoAmount: convertPayableToDisplayValue(recipient.amount),
        }));
        const total = getPaymentsTotal(recipients);

        setLoading(false);
        setError(null);
        setDetails({
          ...res,
          recipients,
          total: {
            amount: total,
            fiatAmount: convertToFiat(convertPayableToDisplayValue(total)),
            cryptoAmount: convertPayableToDisplayValue(total),
          }
        });
      } else {
        fallback(id);
      }
    }).catch(e => {
      fallback(id);
    });
  };

  const getSmartAddressPaymentDetails = address => {
    setLoading(true);
    setDetails(null);
    setError(null);

    const delegatedBatchAbi = contractsInfo && contractsInfo.delegatedBatch && contractsInfo.delegatedBatch.abi;
    const delegatedBatch = new web3.eth.Contract(delegatedBatchAbi, address);
    delegatedBatch.getPastEvents('allEvents', { fromBlock: 1}).then(events => {
      const batchTransferRequest = (events || []).find(i => i.event = EVENT_NAMES.BATCH_TRANSFER_REQUESTED && i.signature === EVENT_SIGNATURES.BATCH_TRANSFER_REQUESTED);
      const returnValues = batchTransferRequest && batchTransferRequest.returnValues;
      const sender = returnValues && returnValues.account,
        amounts = returnValues && returnValues.amounts,
        recipientAddresses = returnValues && returnValues.recipients,
        tokenAddresses = returnValues && returnValues.tokenAddresses;

      if(sender && amounts && recipientAddresses) {
        const recipients = (recipientAddresses || []).map((address, idx) => {
          const amount = amounts[idx] || 0;
          return {
            address,
            name: getContactName(address),
            amount,
            fiatAmount: convertToFiat(convertPayableToDisplayValue(amount)),
            cryptoAmount: convertPayableToDisplayValue(amount),
          }
        });

        setLoading(false);
        setError(null);

        const total = getPaymentsTotal(recipients);
        setDetails({
          sender: {
            address: sender,
            name: getContactName(sender),
          },
          recipients,
          total: {
            amount: total,
            fiatAmount: convertToFiat(convertPayableToDisplayValue(total)),
            cryptoAmount: convertPayableToDisplayValue(total),
          }
        });
      } else {
        setLoading(false);
        setError(ERROR_MESSAGES.INSPECTOR_NO_DETAILS);
      }
    }).catch(e => {
      console.error('events error: ', e);
      setLoading(false);
      setError(ERROR_MESSAGES.INSPECTOR_NO_DETAILS);
    });
  };

  const getGnosisSafeTransaction = hash => {
    setLoading(true);
    setDetails(null);
    setError(null);

    getSafeTransactionByHash(hash, networkId).then(transaction => {
      const { safe, to, value, data, dataDecoded } = transaction || {};

      let recipients = [];
      if(safe && to && (value || dataDecoded)) {
        if(dataDecoded) {
          // Parse multiSend recipients
          const {method, parameters} = dataDecoded || {};
          if(method === 'multiSend' && Array.isArray(parameters) && parameters.length) {
            const { valueDecoded } = parameters[0] || {};
            if(Array.isArray(valueDecoded)) {
              for (const item of valueDecoded) {
                const {to :address, value :amount} = item || {};
                if(address && amount) {
                  recipients.push({
                    address,
                    name: getContactName(address),
                    amount,
                    fiatAmount: convertToFiat(convertPayableToDisplayValue(amount)),
                    cryptoAmount: convertPayableToDisplayValue(amount),
                  });
                }
              }
            }
          }
        }

        if(!recipients.length && value) {
          // Individual recipient
          recipients.push({
            address: to,
            name: getContactName(to),
            amount: value,
            fiatAmount: convertToFiat(convertPayableToDisplayValue(value)),
            cryptoAmount: convertPayableToDisplayValue(value),
          });
        }
      }

      if(recipients.length) {
        setLoading(false);
        setError(null);

        const total = getPaymentsTotal(recipients);
        setDetails({
          /*
          sender: {
            address: '',
            name: getContactName(''),
          },
          */
          recipients,
          total: {
            amount: total,
            fiatAmount: convertToFiat(convertPayableToDisplayValue(total)),
            cryptoAmount: convertPayableToDisplayValue(total),
          }
        });
      } else {
        setLoading(false);
        setError(ERROR_MESSAGES.INSPECTOR_NO_DETAILS);
      }
    }).catch(e => {
      console.error('safe transaction error: ', e);
      setLoading(false);
      setError(ERROR_MESSAGES.INSPECTOR_NO_DETAILS);
    });
  };

  return (
    <div className={classes.container}>

      <div className={classes.content}>
        <SearchBox placeholder="Search by batch address or safe hash"
                   onSearch={value => setSearch(value || '')}
                   className={classes.searchBox}
                   value={search}/>

        {search && (
          loading && (
            <div className={classes.loading}>
              <CircularProgress size={30}/>
            </div>
          ) || (
            error && (
              <Alert severity="error">{error}</Alert>
            ) || (
              (details && (details.sender || details.recipients)) && (
                <>
                  {details.sender && (
                    <div className={classes.section}>
                      <div className={classes.transactionHeader}>Requested By</div>
                      <Card className={cardClasses.container}>
                        <CardContent className={cardClasses.content}>
                          <div className={cardClasses.avatarContainer}>
                            <Avatar className={cardClasses.avatar}>{getInitials(details.sender.name)}</Avatar>
                          </div>
                          <div className={cardClasses.detailsContainer}>
                            <Grid container
                                  direction="row"
                                  justify="space-between">
                              <div className={cardClasses.header}>
                                {details.sender.name || 'Unknown'}
                              </div>
                            </Grid>
                            <Grid container
                                  direction="row"
                                  justify="space-between">
                              <Copy text={details.sender.address}>
                                <div className={cardClasses.subheader}>
                                  {truncateAddress(details.sender.address)}
                                </div>
                              </Copy>
                            </Grid>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) || null}

                  {(details.recipients && details.recipients.length) && (
                    <div className={classes.section}>
                      <div className={classes.transactionHeader}>Recipients ({details.recipients.length})</div>
                      {(details.recipients || []).map(recipient => {
                        return (
                          <Card className={cardClasses.container}>
                            <CardContent className={cardClasses.content}>
                              <div className={cardClasses.avatarContainer}>
                                <Avatar className={cardClasses.avatar}>{getInitials(recipient.name)}</Avatar>
                              </div>
                              <div className={cardClasses.detailsContainer}>
                                <Grid container
                                      direction="row"
                                      justify="space-between">
                                  <div className={cardClasses.header}>
                                    {recipient.name || 'Unknown'}
                                  </div>

                                  <div className={cardClasses.header}>
                                    ${recipient.fiatAmount}
                                  </div>
                                </Grid>
                                <Grid container
                                      direction="row"
                                      justify="space-between">
                                  <Copy text={recipient.address}>
                                    <div className={cardClasses.subheader}>
                                      {truncateAddress(recipient.address)}
                                    </div>
                                  </Copy>

                                  <div className={cardClasses.subheader} style={{whiteSpace: 'nowrap'}}>
                                    {currency || 'ETH'}{' '}{recipient.cryptoAmount}
                                  </div>
                                </Grid>
                                {recipient.note && (
                                  <div className={cardClasses.subheader}>
                                    {recipient.note}
                                  </div>
                                ) || null}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) || null}

                  {details.total && (
                    <Grid container
                          direction="row"
                          justify="space-between"
                          alignItems="center"
                          className={classes.transactionHeader}>
                      <div>Total</div>

                      <div className={classes.transactionAmounts}>
                        <span className={classes.light}>
                              {currency || 'ETH'}{' '}{details.total.cryptoAmount}
                            </span>
                        <span className={classes.bold}>
                            ${details.total.fiatAmount}
                          </span>
                      </div>
                    </Grid>
                  ) || null}
                </>
              ) || (
                <Alert severity="info">{ERROR_MESSAGES.INSPECTOR_NO_DETAILS}</Alert>
              )
            )
          )
        ) || (
          <Alert severity="info">{ERROR_MESSAGES.INSPECTOR_INSTRUCTIONS}</Alert>
        )}
      </div>
    </div>
  );
};