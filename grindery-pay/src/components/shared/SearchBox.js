import React, {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {InputBase} from '@material-ui/core';
import {Search as SearchIcon} from '@material-ui/icons';
import clsx from 'clsx';

import {COLORS} from '../../helpers/style';

const useStyles = makeStyles((theme) => ({
  search: {
    position: 'relative',
    borderRadius: 10,
    backgroundColor: COLORS.contentBg,
    marginRight: theme.spacing(0.5),
    marginLeft: 0,
    width: '100%',
    height: theme.spacing(5),
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
    height: theme.spacing(3),
  },
}));

export default ({value, placeholder, onSearch, className, style}) => {
  const classes = useStyles();
  const [search, setSearch] = useState(value || '');

  useEffect(() => {
    if(value && value !== search) {
      setSearch(value);
    }
  }, [value]);

  useEffect(() => {
    if(onSearch) {
      onSearch(search);
    }
  }, [search]);

  return (
    <div className={clsx(classes.search, className || '')} style={style}>
      <div className={classes.searchIcon}>
        <SearchIcon/>
      </div>
      <InputBase type="search"
                 placeholder={placeholder || 'Search'}
                 value={search}
                 onChange={e => setSearch(e.target.value || '')}
                 classes={{
                   root: classes.inputRoot,
                   input: classes.inputInput,
                 }}
                 inputProps={{'aria-label': placeholder || 'search'}}
      />
    </div>
  );
};