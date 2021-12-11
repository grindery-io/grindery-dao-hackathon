/*global chrome*/
import {togglePopUp, isTopFrame, handleSharedEvents} from './helpers/contentScripts';

// Inject root div if it doesn't already exist
togglePopUp();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if(isTopFrame()) {
    handleSharedEvents(message, sender, sendResponse);
  }
});