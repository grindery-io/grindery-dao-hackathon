import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {createMuiTheme} from '@material-ui/core';

export const COLORS = {
  primary: '#0B0D17',
  secondary: '#8C30F5',
  secondaryLight: '#D6B1FF',
  secondaryLighter: '#F1E4FF',
  contentBg: '#F4F5F7',
  white: '#FFF',
  green: '#00B674',
};

export const DIMENSIONS = {
  width: 415,
  dialogHorizontalMargin: 40,
  dialogHorizontalMarginBig: 100,
};

export const theme = createMuiTheme({
  palette: {
    primary: {
      main: COLORS.primary,
    },
    secondary: {
      main: COLORS.secondary,
    },
    text: {
      primary: COLORS.primary,
    }
  },
  overrides: {
    MuiCssBaseline: {
      '@global': {
        body: {
          backgroundColor: COLORS.white,
        },
        a: {
          color: COLORS.primary,
          textDecoration: 'underline',
        }
      },
    },
    MuiButton: {
      root: {
        borderRadius: 5,
      }
    },
  },
});

export const cardStyles = makeStyles((theme) => ({
  group: {
    marginBottom: theme.spacing(0.5),
    '& > *': {
      marginBottom: '0 !important',
    },
    '& > *:not(:first-child)': {
      borderTopLeftRadius: '0 !important',
      borderTopRightRadius: '0 !important',
    },
    '& > *:not(:last-child)': {
      borderBottomLeftRadius: '0 !important',
      borderBottomRightRadius: '0 !important',
    },
    '& > *:not(:first-child):not(:last-child)': {
      //borderRadius: '0 !important',
    },
  },
  container: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 1.6,
    marginBottom: theme.spacing(1),
    borderRadius: 5,
    boxShadow: 'none',
    //boxShadow: 'inset 0 1px 0px rgba(0, 0, 0, 0.1), inset -1px 0 0 rgba(0, 0, 0, 0.1), inset 0 -1px 0px rgba(0, 0, 0, 0.1), inset 1px 0 0 rgba(0, 0, 0, 0.1)',
    border: `1px solid #D3DEEC`,
    cursor: 'pointer',
    '&:last-child': {
      marginBottom: theme.spacing(0.5),
    },
    '&:hover, &.highlight': {
      borderColor: theme.palette.secondary.main,
    },
    '&.selected': {
      borderColor: theme.palette.secondary.main,
      backgroundColor: COLORS.secondaryLighter,
    },
    '&.alert': {
      color: theme.palette.common.white,
      borderColor: theme.palette.secondary.main,
      backgroundColor: theme.palette.secondary.main,
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1.25),
    '&:last-child': {
      paddingBottom: theme.spacing(1.25),
    },
  },
  avatar: {
    width: 36,
    height: 36,
    marginRight: theme.spacing(1.25),
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarExtraIcon: {
    position: 'absolute',
    right: 8,
    bottom: 0,
    width: 14,
    height: 14,
    backgroundColor: COLORS.white,
    border: `2px solid ${COLORS.white}`,
    borderRadius: 16,
  },
  actions: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '20%',
    marginLeft: theme.spacing(1.5),
  },
  detailsContainer: {
    flexGrow: 1,
  },
  detailsGrid: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailsGridTwoColumn: {
    '& > *': {
      //width: '50%',
    },
    '& > *:last-child': {
      width: '40%',
      marginLeft: theme.spacing(0.5),
    }
  },
  header: {
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.6,
    '&:not(:last-child)': {
      marginBottom: theme.spacing(0.5),
    }
  },
  subheader: {
    fontSize: 12,
    fontWeight: 'normal',
    lineHeight: 1.6,
    color: '#6D6F78',
    '&:not(:last-child)': {
      marginBottom: theme.spacing(0.5),
    }
  },
  bold: {
    fontWeight: 'bold',
  },
  status: {
    display: 'inline-block',
    width: '100%',
    fontSize: 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    color: theme.palette.secondary.main,
    border: `1px solid ${theme.palette.secondary.main}`,
    padding: theme.spacing(0.5),
    whiteSpace: 'nowrap',
  },
  statusSuccess: {
    color: theme.palette.success.main,
    border: `1px solid ${theme.palette.success.main}`,
  },
  statusInfo: {
    fontSize: 9,
    color: theme.palette.info.main,
    border: `1px solid ${theme.palette.info.main}`,
  },
  statusPaid: {
    color: COLORS.green,
    borderWidth: 0,
  }
}));
