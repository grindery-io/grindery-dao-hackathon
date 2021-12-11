/*global chrome*/
import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Button, CircularProgress, FormControlLabel, FormHelperText, Grid, MenuItem, Switch, Select} from '@material-ui/core';
import {Alert} from '@material-ui/lab';

import AppContext from '../../AppContext';

import {
  DIALOG_ACTIONS,
  FIAT_CURRENCIES,
  INTEGRATIONS,
  DEFAULT_STABLE_COINS,
  DISABLED_INTEGRATIONS, HIDDEN_INTEGRATIONS
} from '../../helpers/contants';
import {getIntegrationDetails} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {getAdvancedMode, saveAdvancedMode} from "../../helpers/storage";

let manifest = null;
try {
  manifest = chrome.runtime.getManifest();
} catch (e) {
  //
}

const useStyles = makeStyles((theme) => ({
  container: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1,
    margin: theme.spacing(0.5, 0, 4, 0),
  },
  group: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    paddingBottom: theme.spacing(3.125),
    margin: theme.spacing(2.5, 0),
    '& > *': {
      margin: theme.spacing(1.5, 0),
    },
  },
  toggleContainer: {
    width: '100%',
    display: 'flex',
    margin: 0,
    justifyContent: 'space-between',
  },
  settingsRow: {
    minHeight: 34,
  },
  settingsLabel: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  settingsSelect: {
    fontSize: 14,
    lineHeight: 1.5,
    '&:before': {
      borderWidth: 0,
    }
  },
  integration: {
    padding: theme.spacing(2.75, 0),
    boxShadow: 'inset 0 -1px 0px rgba(0, 0, 0, 0.1)',
    '& > *:not(:last-child)': {
      marginBottom: theme.spacing(3.25),
    },
  },
  logo: {
    height: 35,
  },
  connected: {
    fontWeight: 'bold',
    color: '#2EC5CE',
  },
  disconnected: {
    fontWeight: 'bold',
    color: '#6D6F78',
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  about: {
    color: theme.palette.text.secondary,
    padding: theme.spacing(2.75, 0),
  }
}));

export default () => {
  const classes = useStyles();
  const {fiatCurrency, stableCoin, updateFiatCurrency, updateStableCoin, integrations, openDialog, getIntegrations, removeIntegration} = useContext(AppContext);

  const [advancedMode, setAdvancedMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState({});

  let coinNameToKeyMap = {};
  for (const key of Object.keys(DEFAULT_STABLE_COINS)) {
    coinNameToKeyMap[DEFAULT_STABLE_COINS[key].name] = key;
  }

  useEffect(() => {
    // Load payments
    setLoading(true);
    setError(null);

    getAdvancedMode().then(enabled => {
      setAdvancedMode(!!enabled);
    });

    getIntegrations().then(integrations => {
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(ERROR_MESSAGES.READ_INTEGRATIONS_FAILED);
    });
  }, []);

  const onUpdateAdvancedMode = enabled => {
    setAdvancedMode(!!enabled);
    saveAdvancedMode(!!enabled).catch(() => {});
  };

  const onConnect = name => {
    setConnecting({...connecting, [name]: true});
    switch (name) {
      case INTEGRATIONS.GOOGLE_SHEETS: {
        openDialog(DIALOG_ACTIONS.CONNECT_GOOGLE_SHEET);
        break;
      }
      default: {
        break;
      }
    }
  };

  const onDisconnect = name => {
    removeIntegration(name);
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>General Settings</div>

      {loading && (
        <div className={classes.loading}>
          <CircularProgress size={30}/>
        </div>
      ) || (
        error && (
          <Alert severity="error">{error || ERROR_MESSAGES.READ_INTEGRATIONS_FAILED}</Alert>
        ) || (
          [INTEGRATIONS.GOOGLE_SHEETS, INTEGRATIONS.CIRCLE, INTEGRATIONS.GUSTO].map(name => {
            if(HIDDEN_INTEGRATIONS.includes(name)) {
              return null;
            }

            const isConnected = (integrations || {})[name],
              integrationLogo = getIntegrationDetails(name, 'logo'),
              isDisabled = DISABLED_INTEGRATIONS.includes(name);

            return (
              <div key={name} className={classes.integration}>
                <Grid container
                      direction="row"
                      justify="space-between"
                      alignItems="center">
                  <img src={integrationLogo} height={35}/>
                  <Button type="button"
                          color="primary"
                          variant="contained"
                          disabled={isDisabled}
                          onClick={() => isConnected?onDisconnect(name):onConnect(name)}>
                    {isDisabled?'Coming soon':(isConnected?'Disconnect':'Connect')}
                  </Button>
                </Grid>
                <Grid container
                      direction="row"
                      justify="space-between"
                      alignItems="center">
                  <div>
                    <span>Status: </span>
                    <span className={isConnected?classes.connected:classes.disconnected}>
                  {isDisabled?'Coming soon':(isConnected && 'Connected' || 'Disconnected')}
                </span>
                  </div>

                  <a href="#">
                    Learn more
                  </a>
                </Grid>
              </div>
            );
          })
        )
      )}

      <div className={classes.group}>
        <FormControlLabel
          control={
            <Switch
              name="advanced_mode"
              color="secondary"
              checked={advancedMode}
              onChange={() => onUpdateAdvancedMode(!advancedMode)}
            />
          }
          label="Developer mode"
          labelPlacement="start"
          className={classes.toggleContainer}
          classes={{
            label: classes.settingsLabel,
          }}
        />
        <FormHelperText>
          This will enable a series of features intended for development and debugging. use them carefully or better don’t use them at all.
        </FormHelperText>

        {advancedMode && (
          <>
            <Grid container
                  direction="row"
                  justify="space-between"
                  alignItems="center"
                  className={classes.settingsRow}>
              <div className={classes.settingsLabel}>
                Display currency
              </div>

              {advancedMode && (
                <Select
                  labelId="fiat-currency"
                  id="fiat-currency"
                  value={fiatCurrency}
                  onChange={e => updateFiatCurrency(e.target.value)}
                  className={classes.settingsSelect}>
                  {Object.keys(FIAT_CURRENCIES).map(key => {
                    const code = FIAT_CURRENCIES[key];
                    return (
                      <MenuItem value={code}>{code}</MenuItem>
                    );
                  })}
                </Select>
              ) || (
                <div className={classes.settingsLabel}>
                  {fiatCurrency}
                </div>
              )}
            </Grid>

            {/*
            <Grid container
                  direction="row"
                  justify="space-between"
                  alignItems="center"
                  className={classes.settingsRow}>
              <div className={classes.settingsLabel}>
                Default stable coin
              </div>

              {advancedMode && (
                <Select
                  labelId="stable-coin"
                  id="stable-coin"
                  value={stableCoin && stableCoin.name && coinNameToKeyMap[stableCoin.name]}
                  onChange={e => {
                    const key = e.target.value;
                    if(key && DEFAULT_STABLE_COINS[key]) {
                      updateStableCoin(DEFAULT_STABLE_COINS[key]);
                    }
                  }}
                  className={classes.settingsSelect}>
                  {Object.keys(DEFAULT_STABLE_COINS).map(key => {
                    const option = DEFAULT_STABLE_COINS[key];
                    return (
                      <MenuItem value={key}>{option.name}</MenuItem>
                    );
                  })}
                </Select>
              ) || (
                <div className={classes.settingsLabel}>
                  {stableCoin && stableCoin.name}
                </div>
              )}
            </Grid>
            */}
          </>
        ) || null}
      </div>

      {manifest && manifest.version && (
        <div className={classes.about}>
          {manifest.version && (
            <div><strong>Version:</strong> {manifest.version}</div>
          ) || null}
        </div>
      ) || null}
    </div>
  );
};