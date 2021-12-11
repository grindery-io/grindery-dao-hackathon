import React, {useContext} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {Paper, Tabs, Tab, Tooltip} from '@material-ui/core';
import clsx from 'clsx';

import AppContext from '../../AppContext';

import {DISABLED_SCREENS, HIDDEN_SCREENS, SCREENS} from '../../helpers/contants';
import {getScreenDetails} from '../../helpers/utils';

const useStyles = makeStyles((theme) => ({
  container: {
    background: '#FDFBFF',
    boxShadow: 'inset 0 -2px 20px rgba(0, 0, 0, 0.08)',
    height: '100%',
  },
  tab: {
    minWidth: 0,
  },
  icon: {
    height: 24,
  },
  iconBigger: {
    transform: 'scale(1.5)',
  }
}));

export default () => {
  const classes = useStyles();
  const {accessToken, screen, changeScreen} = useContext(AppContext);

  const tabScreens = [
    SCREENS.HOME, SCREENS.CONTACTS,
    SCREENS.CONTRACTS, SCREENS.PAYMENTS,
    SCREENS.WALLET, SCREENS.FUND, SCREENS.WITHDRAW,
    SCREENS.TRANSACTIONS, SCREENS.INSPECTOR, SCREENS.SETTINGS
  ].filter(i => !HIDDEN_SCREENS.includes(i));
  const currentIdx = accessToken?Math.max(0, tabScreens.findIndex(i => i === screen) || 0):-1;
  return (
    <Paper square className={classes.container}>
      <Tabs orientation="vertical"
            value={currentIdx}
            onChange={(event, idx) => {
              const newScreen = tabScreens[idx];
              if(newScreen && ![...HIDDEN_SCREENS, ...DISABLED_SCREENS].includes(newScreen)) {
                changeScreen(newScreen);
              }
            }}
            variant="scrollable"
            indicatorColor="primary"
            textColor="primary"
            aria-label="tabs"
            TabIndicatorProps={{
              style: {left: 0, right: 'auto'}
            }}
      >
        {tabScreens.map((screen, idx) => {
          const screenIcons = getScreenDetails(screen, 'icon');
          let title = getScreenDetails(screen, 'tooltip') || getScreenDetails(screen, 'title'),
            icon = screenIcons && screenIcons.main,
            iconLight = screenIcons && (screenIcons.light || screenIcons.main);

          if(DISABLED_SCREENS.includes(screen)) {
            icon = iconLight;
            title = `${title} not available. Coming soon.`
          }

          return (
            <Tab className={classes.tab}
                 aria-label={screen}
                 icon={(
                   <Tooltip title={title}
                            placement="left">
                     <img src={currentIdx !== idx?iconLight:icon}
                          className={classes.icon}/>
                   </Tooltip>
                 )}
            />
          );
        })}
      </Tabs>
    </Paper>
  );
};