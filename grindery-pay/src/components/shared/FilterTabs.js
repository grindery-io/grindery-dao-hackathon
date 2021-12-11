import React, {useEffect, useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  AppBar,
  Tabs,
  Tab
} from '@material-ui/core';
import clsx from 'clsx';

const useStyles = makeStyles((theme) => ({
  container: {
    position: 'sticky',
    top: 0,
    backgroundColor: theme.palette.common.white,
    marginBottom: theme.spacing(1),
  },
  tab: {
    minWidth: 0,
    textTransform: 'none',
    whiteSpace: 'nowrap',
  },
  selectedTab: {
    color: `${theme.palette.secondary.main} !important`,
  },
}));

export default ({items, selectedItem, onChange, className, style}) => {
  const classes = useStyles();
  const [currentIdx, setFilter] = useState(0);

  useEffect(() => {
    const selectedItemIdx = selectedItem && (items || []).indexOf(selectedItem);
    if(selectedItemIdx > -1 && selectedItemIdx !== currentIdx) {
      setFilter(selectedItemIdx);
    }
  }, []);

  if(!items || !Array.isArray(items) || !items.length) {
    return null;
  }

  useEffect(() => {
    if(onChange) {
      const cleanedIdx = typeof currentIdx === 'number' && currentIdx > -1 && currentIdx < items.length?currentIdx:0;
      if(cleanedIdx === currentIdx) {
        onChange(items[cleanedIdx]);
      } else {
        setFilter(cleanedIdx);
      }
    }
  }, [currentIdx]);

  return (
    <AppBar position="static"
            color="default"
            className={clsx(classes.container, className || '')}
            style={style}>
      <Tabs value={currentIdx}
            onChange={(event, idx) => {
              setFilter((typeof idx === 'number' && idx > -1 && idx < items.length)?idx:0);
            }}
            variant="fullWidth"
            indicatorColor="secondary"
            textColor="primary"
            aria-label="tabs">
        {(items || []).map((filter, idx) => {
          return (
            <Tab className={clsx(classes.tab, {[classes.selectedTab]: currentIdx === idx})}
                 aria-label={filter}
                 label={filter}
            />
          );
        })}
      </Tabs>
    </AppBar>
  );
};