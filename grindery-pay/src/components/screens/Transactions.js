import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {CircularProgress} from '@material-ui/core';

import FilterTabs from '../shared/FilterTabs';
import SearchBox from '../shared/SearchBox';
import TransactionsList from '../shared/TransactionsList';

import AppContext from '../../AppContext';

import {ERROR_MESSAGES} from '../../helpers/errors';
import {
  TRANSACTION_DIRECTIONS,
  TRANSACTION_VIEWS
} from '../../helpers/contants';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  content: {
    padding: theme.spacing(1.5, 2, 2),
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
}));

export default () => {
  const classes = useStyles();
  const {screenTab, transactions, syncDataAndRefresh} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFilter, setCurrentFilter] = useState(screenTab || null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Load payments
    setLoading(true);
    setError(null);

    syncDataAndRefresh().then(() => {
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(ERROR_MESSAGES.READ_PAYMENTS_FAILED);
    });
  }, []);

  const FILTERS = [
    TRANSACTION_VIEWS.ALL,
    // TRANSACTION_VIEWS.RECEIVED, TRANSACTION_VIEWS.SENT,
    TRANSACTION_VIEWS.PROCESSING, TRANSACTION_VIEWS.COMPLETED
  ];

  let filteredTransactions = transactions.filter(transaction => {
    const isPaid = transaction && (
      typeof transaction.confirmed !== 'boolean' ||
      (transaction.confirmed && !transaction.delegated) ||
      (transaction.delegated && transaction.delegatedConfirmed)
    );
    if(currentFilter === TRANSACTION_VIEWS.PROCESSING) {
      return !isPaid;
    } if(currentFilter === TRANSACTION_VIEWS.COMPLETED) {
      return isPaid;
    } else if(currentFilter === TRANSACTION_VIEWS.RECEIVED) {
      return transaction.direction === TRANSACTION_DIRECTIONS.IN;
    } else if(currentFilter === TRANSACTION_VIEWS.SENT) {
      return transaction.direction !== TRANSACTION_DIRECTIONS.IN;
    } else {
      return true;
    }
  });

  return (
    <div className={classes.container}>
      <FilterTabs items={FILTERS} onChange={setCurrentFilter}/>

      <div className={classes.content}>
        <SearchBox placeholder="Transactions"
                   onSearch={value => setSearch(value || '')}
                   className={classes.searchBox}/>

        {loading && (
          <div className={classes.loading}>
            <CircularProgress size={30}/>
          </div>
        ) || (
          <TransactionsList transactions={filteredTransactions} search={search} error={error}/>
        )}
      </div>
    </div>
  );
};