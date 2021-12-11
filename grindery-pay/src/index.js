/*global chrome*/
import React from 'react';
import ReactDOM from 'react-dom';
import {CssBaseline, ThemeProvider} from '@material-ui/core';
import DateFnsUtils from '@date-io/date-fns';
import enLocale from 'date-fns/locale/en-US';
import {MuiPickersUtilsProvider} from '@material-ui/pickers';

import App from './components/containers/App';
import ErrorBoundary from './components/containers/ErrorBoundary';

//import reportWebVitals from './reportWebVitals';

import {theme} from './helpers/style';

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline/>

      <MuiPickersUtilsProvider utils={DateFnsUtils}
                               locale={enLocale}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </MuiPickersUtilsProvider>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('grindery-payroll-extension-root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
