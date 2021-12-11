import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {IconButton} from '@material-ui/core';
import {Add as AddIcon} from '@material-ui/icons';
import clsx from 'clsx';

import SearchBox from '../shared/SearchBox';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    //position: 'sticky',
    //top: 0,
    zIndex: 1,
    marginBottom: theme.spacing(2),
  }
}));

export default ({placeholder, onSearch, onAdd, className, style}) => {
  const classes = useStyles();

  return (
    <div className={clsx(classes.container, className || '')} style={style}>
      <SearchBox placeholder={placeholder}
                 onSearch={onSearch}/>

      <IconButton color="secondary"
                  onClick={() => onAdd && onAdd()}
                  disabled={!onAdd}>
        <AddIcon/>
      </IconButton>
    </div>
  );
};