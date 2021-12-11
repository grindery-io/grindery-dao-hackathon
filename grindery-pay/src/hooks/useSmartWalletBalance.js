import {useState, useEffect} from 'react';
import Decimal from 'decimal.js';


import {TASKS, CUSTOM_TOKENS, FIAT_CURRENCIES} from '../helpers/contants';
import {makeBackgroundRequest} from '../helpers/routines';
import contracts from '../helpers/contracts.json';
import {getPriceData} from '../helpers/utils';


export default (address, networkId, currency) => {
  const [balance, setBalance] = useState({});

  const convertPayableToDisplayValue = (amount, decimals) => {
    return new Decimal(amount || 0).dividedBy(new Decimal(10).pow(decimals || 18).toNumber()).toNumber();
  };

  const convertToFiat = (value, rate) => {
    let decimalFiat = new Decimal(0);
    const decimalValue = new Decimal(value || 0),
      decimalRate = new Decimal(rate || 0);
    if(decimalValue.gt(0) && decimalRate.gt(0)) {
      decimalFiat = decimalValue.dividedBy(decimalRate);
    }
    return decimalFiat.toNumber();
  };

  const updateBalanceState = (token, cryptoAmount, fiatAmount) => {
    setBalance(balance => {
      const updatedBalance = {
        ...(balance || {}),
        tokens: {
          ...(balance && balance.tokens || {}),
          [token]: {
            [token]: cryptoAmount,
            [FIAT_CURRENCIES.USD]: fiatAmount,
          },
        },
      };

      let total = new Decimal(0);
      for (const token of Object.keys(updatedBalance && updatedBalance.tokens || {})) {
        total = total.plus(updatedBalance && updatedBalance.tokens && updatedBalance.tokens[token] && updatedBalance.tokens[token][FIAT_CURRENCIES.USD] || 0);
      }

      return {
        ...updatedBalance,
        [FIAT_CURRENCIES.USD]: total.toFixed(2),
      };
    });
  };

  const addToBalance = (token, amount) => {
    let cryptoAmount = 0;

    if(amount > 0) {
      const decimals = contracts && contracts.token && contracts.token[token] && contracts.token[token].decimals || 18;
      cryptoAmount = convertPayableToDisplayValue(amount, decimals);

      getPriceData(token, FIAT_CURRENCIES.USD).then(data => {
        const rate = new Decimal(data && data[token] || 0).toNumber() || 0;
        updateBalanceState(token, cryptoAmount, convertToFiat(cryptoAmount, rate));
      }).catch(e => {
        updateBalanceState(token, cryptoAmount, 0);
      });
    } else {
      updateBalanceState(token, 0, 0);
    }
  };

  useEffect(() => {
    if(address) {
      const nativeToken = currency || 'ETH';

      makeBackgroundRequest(TASKS.GET_BALANCE, {address}).then(res => {
        addToBalance(nativeToken, res || 0);
      }).catch(() => {
        addToBalance(nativeToken, 0);
      });

      if(contracts && contracts.token && networkId) {
        for (const key of Object.keys(CUSTOM_TOKENS)) {
          const token = CUSTOM_TOKENS[key];
          makeBackgroundRequest(TASKS.GET_TOKEN_BALANCE, {address, token, chain: networkId}).then(res => {
            addToBalance(token, res || 0);
          }).catch(e => {
            addToBalance(token, 0);
          });
        }
      }

    }
  }, [address, networkId]);

  return balance;
}