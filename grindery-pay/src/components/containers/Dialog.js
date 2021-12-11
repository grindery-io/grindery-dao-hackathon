import React from 'react';
import {makeStyles} from '@material-ui/core/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@material-ui/core';
import clsx from 'clsx';

import {DIMENSIONS} from '../../helpers/style';

import closeIcon from '../../images/close-black.svg'

export const useStyles = makeStyles((theme) => ({
  dialog: {
    width: `calc(100% - ${DIMENSIONS.dialogHorizontalMargin*2}px)`,
    maxWidth: `calc(${DIMENSIONS.width}px - ${DIMENSIONS.dialogHorizontalMargin*2}px)`,
    inset: `${theme.spacing(6.875)}px auto auto ${DIMENSIONS.dialogHorizontalMargin}px  !important`,
    maxHeight: `calc(100vh - ${theme.spacing(6.875*1.2)}px)`,
    overflowY: 'auto',
  },
  dialogTall: {
    //top: `${theme.spacing(11.25)}px !important`,
  },
  dialogTaller: {
    top: `${theme.spacing(5)}px !important`,
  },
  dialogNarrow: {
    width: `calc(100% - ${DIMENSIONS.dialogHorizontalMarginBig*2}px)`,
    maxWidth: `calc(${DIMENSIONS.width}px - ${DIMENSIONS.dialogHorizontalMarginBig*2}px)`,
    inset: `${theme.spacing(6.875)}px auto auto ${DIMENSIONS.dialogHorizontalMarginBig}px  !important`,
  },
  dialogTitle: {
    position: 'relative',
    fontSize: 22,
    fontWeight: 'normal',
    lineHeight: 1.6,
    textAlign: 'center',
    padding: theme.spacing(2.5, 2.5, 1.25),
  },
  dialogClose: {
    position: 'absolute',
    top: theme.spacing(1.5),
    right: theme.spacing(1.5),
    //fontSize: 14,
    //width: 14,
    //height: 14,
    '& svg, & img': {
      fontSize: 14,
      width: 14,
      height: 14,
    }
  },
  dialogContainer: {
    color: '#363636',
    borderRadius: 10,
  },
  dialogContent: {
    padding: theme.spacing(1.25, 2.5, 1.25),
  },
  dialogActions: {
    margin: theme.spacing(1.25, 0, 1.25),
    '& button': {
      display: 'block',
      width: '100%',
    },
    '& button + button': {
      marginTop: theme.spacing(1.25),
    }
  },
  dialogActionsGrid: {
    width: '100%',
    '& button + button': {
      marginTop: 0,
      marginLeft: theme.spacing(1.25),
    },
    '& > *': {

    }
  },
  dialogActionsOverride: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    marginLeft: theme.spacing(2.5),
    marginRight: theme.spacing(2.5),
  },
}));

export default ({children, title, content, actions, className, onClose, ariaLabel, closeOnOutsideClick, ...props}) => {
  const classes = useStyles();

  return (
    <Dialog {...props}
            open={true}
            onClose={onClose}
            fullScreen={true}
            disableBackdropClick={!closeOnOutsideClick}
            disableEscapeKeyDown={!closeOnOutsideClick}
            onBackdropClick={() => {
              if(closeOnOutsideClick) {
                onClose();
              }
            }}
            className={className || ''}
            classes={{
              root: classes.dialog,
              paper: classes.dialogContainer,
            }}
            aria-labelledby={ariaLabel || (typeof title === 'string' && title) || ''}>
      {title && (
          <DialogTitle className={classes.dialogTitle}>
            {title || ''}

            {(onClose && !closeOnOutsideClick) && (
                <IconButton className={classes.dialogClose}
                            aria-label="close"
                            onClick={onClose}>
                  <img src={closeIcon}/>
                </IconButton>
            ) || null}
          </DialogTitle>
      )}

      <DialogContent className={classes.dialogContent}>
        {children || content}
      </DialogContent>

      {actions && (
        <DialogActions className={clsx(classes.dialogActions, classes.dialogActionsOverride)}>
          {actions}
        </DialogActions>
      ) || null}
    </Dialog>
  );
};