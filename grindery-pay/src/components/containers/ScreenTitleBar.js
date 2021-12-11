import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';

import AppContext from '../../AppContext';

import {getScreenDetails} from '../../helpers/utils';


const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(2.5),
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: 'inset 0 -1px 0px rgba(0, 0, 0, 0.1)',
  },
  title: {
    display: 'inline-block',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1,
    marginLeft: theme.spacing(1.2),
  },
}));

export default () => {
  const classes = useStyles();
  const {accessToken, screen} = useContext(AppContext);

  if(!accessToken) {
    return null;
  }

  const screenTitle = getScreenDetails(screen, 'title');

  return (
    <div className={classes.container}>
      <div className={classes.title}>{screenTitle}</div>
    </div>
  );
};