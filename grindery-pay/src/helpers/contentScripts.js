/*global chrome*/
import {ACTIONS, EXTENSION_SELECTOR_NAME, MESSAGE_TYPES} from './contants';
import {ERROR_MESSAGES} from "./errors";

export const isTopFrame = () => window.top === window.self;

export const isAragonIframe = () => {
  return window.location.hostname === 'ipfs.eth.aragon.network';
};

export const isAragonTab = () => {
  return window.location.hostname === 'client.aragon.org';
};

export const isHarmonyMultiSigTab = () => {
  return /(\w+\.)?multisig\.harmony\.one$/i.test(window.location.hostname);
};

export const isGnosisSafeTab = () => {
  return /(\w+\.)?gnosis-safe\.io$/i.test(window.location.hostname) || isHarmonyMultiSigTab();
};

export const getPopUpElement = () => {
  return document.getElementById(EXTENSION_SELECTOR_NAME);
};

export const openPopUp = (frameElement) => {
  if(!frameElement) {
    frameElement = getPopUpElement();
  }
  if(!frameElement) {
    let elem = document.createElement('iframe');
    elem.id = EXTENSION_SELECTOR_NAME;
    elem.src = chrome.runtime.getURL('index.html');
    elem.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    z-index: 99999;
    width: 415px;
    height: 100vh;
    border-width: 0;
  `;
    document.body.appendChild(elem);
  }
};

export const closePopUp = (frameElement) => {
  if(!frameElement) {
    frameElement = getPopUpElement();
  }
  if(frameElement) {
    frameElement.remove();
  }
};

export const togglePopUp = () => {
  const frameElement = getPopUpElement();
  if(frameElement) {
    closePopUp(frameElement);
  } else {
    openPopUp(frameElement);
  }
};

export const getActiveGoogleSheetData = () => {
  let spreadsheetId = null,
    sheetIdx = null,
    sheetTitle = null;

  if(window.location.hostname === 'docs.google.com') {
    const [, appType, prefix, id] = (window.location.pathname || '').split('/');
    if(appType === 'spreadsheets' && prefix === 'd') {
      spreadsheetId = id;
    }
    if(id) {
      const selectedSheets = document.querySelectorAll(
        '.docs-sheet-tab.docs-sheet-active-tab .docs-sheet-tab-caption .docs-sheet-tab-name'
      );
      if(selectedSheets && selectedSheets.length) {
        sheetTitle = (selectedSheets[0].innerHTML || '').trim();

        const allSheets = document.querySelectorAll(
          '.docs-sheet-tab'
        );
        if(allSheets && allSheets.length) {
          for (const [idx, node] of allSheets.entries()) {
            const nameNodes = node.querySelectorAll('.docs-sheet-tab-caption .docs-sheet-tab-name');
            if(nameNodes && nameNodes.length) {
              const itemName = (nameNodes[0].innerHTML || '').trim();
              if(itemName === sheetTitle) {
                sheetIdx = idx;
              }
            }
          }
        }
      }
    }
  }

  if(spreadsheetId) {
    return {
      id: spreadsheetId || null,
      ...((sheetIdx || sheetTitle)?{
        sheet: {
          index: sheetIdx || null,
          title: sheetTitle || null,
        },
      }:{}),
    };
  }
  return null;
};

export const getGnosisSafeAddress = () => {
  const [, pathPrefix, networkAndSafeAddress] = (window.location.pathname || '').split('/');
  if(pathPrefix === 'app' && networkAndSafeAddress) {
    const safeAddress = networkAndSafeAddress.split(':').pop();
    if(safeAddress) {
      return safeAddress;
    }
  }
  const [hash, hashPrefix, safeAddress] = (window.location.hash || '').split('/');
  if(hash === '#' && hashPrefix === 'safes' && safeAddress) {
    return safeAddress;
  }
};

export const handleSharedEvents = (message, sender, sendResponse) => {
  const sendSuccessResponse = data => {
    sendResponse({
      data,
    });
  };

  const sendErrorResponse = error => {
    sendResponse({
      error: (error && error.message) || (error && typeof error === 'string' && error) || ERROR_MESSAGES.UNKNOWN,
    });
  };

  if(message && message.type === MESSAGE_TYPES.ACTION && isTopFrame()) {
    const action = message && message.action || null;
    switch (action) {
      case ACTIONS.CLOSE: {
        closePopUp();
        sendSuccessResponse({message: 'closed'});
        return ;
      }
      case ACTIONS.GET_ACTIVE_GOOGLE_SHEET_INFO: {
        const data = getActiveGoogleSheetData();
        if(data) {
          sendSuccessResponse(data);
        } else {
          sendErrorResponse('Failed to retrieve Google sheets data');
        }
        return ;
      }
      case ACTIONS.GET_ACTIVE_ARAGON_DAO_INFO: {
        if(isAragonTab()) {
          const [hash, daoName, appAddress] = (window.location.hash || '').split('/');
          if(hash === '#' && daoName) {
            sendSuccessResponse({
              daoName: (daoName || '').replace('.aragonid.eth', ''),
              appAddress,
            });
          } else {
            sendErrorResponse('Not active aragon dao');
          }
        } else {
          sendErrorResponse('Not an aragon domain');
        }
        return ;
      }
      case ACTIONS.GET_ACTIVE_GNOSIS_SAFE_INFO: {
        if(isGnosisSafeTab()) {
          const safeAddress = getGnosisSafeAddress();
          if(safeAddress) {
            sendSuccessResponse({
              safeAddress,
              domain: window.location.hostname,
            });
          }
          sendErrorResponse('No active gnosis safe');
        } else {
          sendErrorResponse('Not a gnosis safe');
        }
        return ;
      }
      default: {
        break;
      }
    }
    // sendErrorResponse(); TODO: @david confirm if this is necessary
  }
};

