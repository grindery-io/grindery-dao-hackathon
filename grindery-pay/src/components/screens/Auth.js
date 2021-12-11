import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Button, CircularProgress, TextField, Typography} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import _ from 'lodash';

import AppContext from '../../AppContext';

import {SCREENS} from '../../helpers/contants';
import {ERROR_MESSAGES} from '../../helpers/errors';

const useStyles = makeStyles((theme) => ({
  container: {
    flexGrow: 1,
    alignSelf: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoWrapper: {
    textAlign: 'center',
  },
  logo: {
    height: 60,
    marginBottom: theme.spacing(5),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 1.1,
    textAlign: 'center',
    marginBottom: theme.spacing(1.25),
  },
  passcodeLabel: {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.5,
    textAlign: 'center',
    color: '#6D6F78',
    marginBottom: theme.spacing(5),
  },
  passcodeFields: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passcodeDigit: {
    width: `calc(25% - ${theme.spacing(1)}px)`,
    boxSizing: 'border-box',
    '& input': {
      fontSize: 36,
      lineHeight: 1,
      textAlign: 'center',
    }
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(1.5),
  },
  errorWrapper: {
    width: '100%',
    margin: `${theme.spacing(2)}px 0`,
  }
}));

export default () => {
  const classes = useStyles();
  const {isNewUser, authenticate, changeScreen} = useContext(AppContext);

  const [passcodeArray, setPasscodeArray] = useState([]);
  const [newPasscode, setNewPasscode] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const doAuth = passcode => {
    authenticate(passcode).then(res => {
      setVerifying(false);
      setPasscodeArray([]);
      changeScreen(SCREENS.HOME);
    }).catch(e => {
      setVerifying(false);
      setPasscodeArray([]);
      setError(e && e.message || ERROR_MESSAGES.WRONG_PASSCODE);
    });
  };

  useEffect(() => {
    if(passcodeArray.length === 4) {
      const passcode = passcodeArray.join('');
      if(isNewUser) {
        if(newPasscode) {
          if(passcode === newPasscode) {
            // User confirmed the passcode
            doAuth(passcode);
          } else {
            // User failed to confirm passcode
            setPasscodeArray([]);
            setError(ERROR_MESSAGES.WRONG_CONFIRM_PASSCODE);
          }
        } else {
          // Prompt user to confirm passcode
          setNewPasscode(passcode);
          setPasscodeArray([]);
        }
      } else {
        doAuth(passcode);
      }
    } else if(error && passcodeArray.length) {
      setError(null);
    }
  }, [passcodeArray]);

  return (
    <div className={classes.container}>
      <Typography variant="h2" component="h2" className={classes.title}>
        Welcome to Grindery
      </Typography>

      <Typography variant="h2" component="h2" className={classes.passcodeLabel}>
        {isNewUser?(newPasscode?'Confirm':'Setup'):'Enter'} your pass code
      </Typography>

      {verifying && (
        <div className={classes.loading}>
          <CircularProgress size={30}/>
        </div>
      ) || (
        <div className={classes.passcodeFields}>
          {_.range(0, 4).map(idx => {
            const isDisabled = passcodeArray.length !== idx;
            return (
              <TextField key={`passcode-digit-${idx}`}
                         name={`passcode-digit-${idx}`}
                         type="password"
                         className={classes.passcodeDigit}
                         placeholder={passcodeArray.length === idx?'':'*'}
                         value={passcodeArray[idx] || ''}
                         onKeyDown={e => {
                           if(e.code === 'Backspace') {
                             if(passcodeArray.length) {
                               let newPasscodeArray = [...passcodeArray];
                               newPasscodeArray.pop();
                               setPasscodeArray(newPasscodeArray);
                             }
                           }
                         }}
                         onChange={e => {
                           const digit = e.target.value;
                           if (/\d+/.test(digit)) {
                             let newPasscodeArray = [...passcodeArray];
                             newPasscodeArray[idx] = digit;
                             setPasscodeArray(newPasscodeArray);
                           }
                         }}
                         autoFocus={idx === 0}
                         disabled={isDisabled}
                         inputRef={ref => {
                           if(ref && !isDisabled) {
                             ref.focus();
                           }
                         }}
              />
            );
          })}
        </div>
      )}

      {error && (
        <div className={classes.errorWrapper}>
          <Alert severity="error">{error || ''}</Alert>
        </div>
      ) || null}

      {isNewUser && error && (
        <Button type="button"
                color="primary"
                variant="contained"
                onClick={() => {
                  setNewPasscode(null);
                  setPasscodeArray([]);
                  setError(null);
                }}>
          Start Over
        </Button>
      ) || null}
    </div>
  );
}
