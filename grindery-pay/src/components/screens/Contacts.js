import React, {useContext, useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from '@material-ui/core';
import {Alert} from '@material-ui/lab';
import clsx from 'clsx';

import Copy from '../shared/Copy';
import SearchAndAdd from '../shared/SearchAndAdd';

import AppContext from '../../AppContext';

import {DIALOG_ACTIONS, SCREENS} from '../../helpers/contants';
import {getContactPayments, getInitials, getPaymentsTotal, searchItems, truncateAddress} from '../../helpers/utils';
import {ERROR_MESSAGES} from '../../helpers/errors';
import {cardStyles, COLORS} from '../../helpers/style';

const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  search: {
    position: 'relative',
    borderRadius: 10,
    backgroundColor: COLORS.contentBg,
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    height: theme.spacing(4),
    boxSizing: 'border-box',
  },
  searchIcon: {
    color: '#9D9D9D',
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRoot: {
    width: '100%',
    color: 'inherit',
  },
  inputInput: {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
    transition: theme.transitions.create('width'),
    width: '100%',
  },
  loading: {
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  emptyActions: {
    textAlign: 'center',
    margin: theme.spacing(3, 0),
    '& > *': {
      marginBottom: theme.spacing(2),
    }
  }
}));

export default () => {
  const classes = useStyles();
  const cardClasses = cardStyles();
  const {currency, contacts, payments, changeScreen, openDialog, convertToCrypto, syncDataAndRefresh} = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Load contacts
    setLoading(true);
    setError(null);

    syncDataAndRefresh().then(() => {
      setLoading(false);
    }).catch(e => {
      setLoading(false);
      setError(ERROR_MESSAGES.READ_CONTACTS_FAILED);
    });
  }, []);

  const onAddContact = e => {
    e && e.preventDefault();
    openDialog(DIALOG_ACTIONS.ADD_CONTACT);
  };

  const goToSettings = e => {
    e && e.preventDefault();
    changeScreen(SCREENS.SETTINGS);
  };

  const contactResults = searchItems(
    search, contacts, ['name', 'email', 'address'], ['name', 'email']
  );

  return (
    <div className={classes.container}>
      <SearchAndAdd placeholder="Contacts"
                    onSearch={value => setSearch(value || '')}
                    onAdd={onAddContact}/>

      {loading && (
        <div className={classes.loading}>
          <CircularProgress size={30}/>
        </div>
      ) || (
        <div>
          {contacts && contacts.length && (
            (contactResults || []).map(contact => {
              const fiatTotal = getPaymentsTotal(getContactPayments(contact, payments)),
                cryptoTotal = convertToCrypto(fiatTotal);
              return (
                <Card className={cardClasses.container}>
                  <CardContent className={cardClasses.content}>
                    <Avatar className={cardClasses.avatar}>{getInitials(contact.name)}</Avatar>
                    <div
                      className={clsx(cardClasses.detailsContainer, cardClasses.detailsGrid, cardClasses.detailsGridTwoColumn)}>
                      <div>
                        <div className={cardClasses.header}>
                          {contact.name}
                        </div>
                        {contact.email && (
                          <div className={cardClasses.subheader}>
                            {contact.email}
                          </div>
                        ) || null}
                        <Copy text={contact.address}>
                          <div className={cardClasses.subheader}>
                            {truncateAddress(contact.address)}
                          </div>
                        </Copy>
                      </div>
                      <div>
                        <div className={cardClasses.subheader}>
                          Total Due
                        </div>
                        <div className={cardClasses.header}>
                          ${fiatTotal}
                        </div>
                        {currency && (
                          <div className={cardClasses.subheader}>
                            {cryptoTotal}{' '}{currency}
                          </div>
                        ) || null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) || (
            <>
              <Alert severity={error && 'error' || 'info'}>
                {error || (
                  <>
                    <div>{ERROR_MESSAGES.NO_CONTACTS}</div>
                  </>
                )}
              </Alert>

              <div className={classes.emptyActions}>
                <Button type="button"
                        color="primary"
                        variant="outlined"
                        onClick={onAddContact}>
                  Add a Contact
                </Button>

                <Button type="button"
                        color="primary"
                        variant="outlined"
                        onClick={goToSettings}>
                  Configure an Integration
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};