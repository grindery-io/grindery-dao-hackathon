import React, {useContext, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Alert} from '@material-ui/lab';

import FilterTabs from '../shared/FilterTabs';
import SearchAndAdd from '../shared/SearchAndAdd';

import AppContext from '../../AppContext';

import {CONTRACT_VIEWS} from '../../helpers/contants';


const useStyles = makeStyles((theme) => ({
  container: {
    width: '100%',
  },
  content: {
    padding: theme.spacing(1.5, 2, 2),
    '& > *': {
      width: '100%',
    }
  },
}));

export default () => {
  const classes = useStyles();
  const {screenTab} = useContext(AppContext);

  const FILTERS = [CONTRACT_VIEWS.ALL, CONTRACT_VIEWS.RECEIVED, CONTRACT_VIEWS.SENT];

  const [currentFilter, setCurrentFilter] = useState(screenTab || null);

  return (
    <div className={classes.container}>
      <FilterTabs items={FILTERS} onChange={setCurrentFilter}/>

      <div className={classes.content}>
        <SearchAndAdd placeholder="Contracts"/>

        <Alert severity="info">Coming soon.</Alert>
      </div>
    </div>
  );
};