/*global chrome*/
import $ from 'jquery';
import axios from 'axios';
import Web3 from 'web3';

import {ACTIONS, EXTENSION_META_BUTTON_SELECTOR_NAME, MESSAGE_TYPES, META_EVENTS, TASKS} from './helpers/contants';
import {ERROR_MESSAGES} from './helpers/errors';
import {
  getGnosisSafeAddress,
  handleSharedEvents,
  isAragonIframe, isGnosisSafeTab,
  isTopFrame,
  openPopUp, togglePopUp
} from './helpers/contentScripts';
import {makeBackgroundRequest} from './helpers/routines';


if(isAragonIframe()) {
  $(document).ready(() => {
    const injectMetaButton = (delay=500) => {
      setTimeout(() => {
        const voteDescriptionContainer = $('[class^="VoteDescription___"]');
        const metaButtonSelector = `#${EXTENSION_META_BUTTON_SELECTOR_NAME}`;
        const metaButton = voteDescriptionContainer.find(metaButtonSelector);
        if(!metaButton.length) {
          const addressButtons = voteDescriptionContainer.find('[class^="DetailedDescription___"] button[class^="BadgeBase___"]');
          if(addressButtons.length) {
            const batchAddress = addressButtons.attr('title');
            if(batchAddress) {
              voteDescriptionContainer.append(`
                    <button id="${EXTENSION_META_BUTTON_SELECTOR_NAME}" 
                            style="padding: 8px;color: #fff;margin: 16px 0;background-color: #000;border: 1px solid #000;border-radius: 5px;cursor: pointer;">
                      View Details with Grindery
                    </button>
                  `);
              $(metaButtonSelector).click(() => {
                makeBackgroundRequest(TASKS.OPEN_META_POPUP, {
                  url: window.location.href,
                  query: batchAddress
                }).catch(e => {
                  console.error('gMeta iframe:error', e);
                });
              });
            }
          }
        }
      }, delay);
    };

    injectMetaButton();

    const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    const observer = new MutationObserver(function(mutations, observer) {
      // fired when a mutation occurs
      injectMetaButton();
    });

    // define element to observer and types of mutations
    observer.observe(document, {
      subtree: true,
      attributes: true,
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    const action = message && message.action || null,
      payload = message && message.payload || null;

    switch (action) {
      case ACTIONS.OPEN_META_POPUP: {
        const {query} = payload || {};
        openPopUp();
        if(query) {
          setTimeout(() => {
            makeBackgroundRequest(TASKS.RELAY_META_EVENT, {
              query,
            }).catch(e => {
              console.error('gMeta iframe:error', e);
            });
          }, 200);
        }
        sendSuccessResponse({message: 'received'});
        return ;
      }
      case ACTIONS.TOGGLE_META_POPUP: {
        togglePopUp();
        sendSuccessResponse({message: 'received'});
        return ;
      }
      case ACTIONS.ADD_META: {
        sendSuccessResponse({message: 'received'});
        if(isGnosisSafeTab()) {
          if(/^\/app\//i.test(window.location.pathname) && /\/transactions\/(queue|history)/i.test(window.location.pathname)) {
            const view = /\/queue/i.test(window.location.pathname)?'queued':'history';
            const safeAddress = getGnosisSafeAddress();
            if(safeAddress) {
              const {networkId} = payload || {};
              axios.get(
                `https://safe-client.gnosis.io/v1/chains/${networkId || '4'}/safes/${safeAddress}/transactions/${view}/`
              ).then(res => {
                const { results } = res && res.data;
                if(results && Array.isArray(results) && results.length) {
                  const transactions = (results || []).filter(i => i.type === 'TRANSACTION' && i.transaction).map(i => i.transaction);
                  if(transactions.length) {
                    const scrollContainer = $('#infinite-scroll-container');
                    const metaButtonSelector = `.${EXTENSION_META_BUTTON_SELECTOR_NAME}`;
                    const metaButtons = scrollContainer.find(metaButtonSelector);
                    if(!metaButtons.length) {
                     const transactionRows = scrollContainer.find('.MuiPaper-root.MuiAccordion-root > .MuiButtonBase-root.MuiAccordionSummary-root:first-child');
                     const transactionInfoContainers = transactionRows.find('.tx-info');
                      for (const [idx, elem] of transactionInfoContainers.toArray().entries()) {
                        const transaction = transactions[idx];
                        if(transaction && transaction.id) {
                          const [type, address, safeTxHash] = (transaction.id || '').split('_');
                          if(type === 'multisig' && safeTxHash) {
                            $(elem).append(`
                    <button class="${EXTENSION_META_BUTTON_SELECTOR_NAME}" 
                            data-safe-tx-hash="${safeTxHash}"
                            style="display: inline-block; color: #fff;padding: 4px 8px;margin-left: 4px;background-color: #000;border: 1px solid #000;border-radius: 5px;cursor: pointer;">
                      View Details with Grindery
                    </button>
                  `);
                            $(metaButtonSelector).click(function () {
                              const hash = $(this).attr('data-safe-tx-hash');
                              makeBackgroundRequest(TASKS.OPEN_META_POPUP, {
                                url: window.location.href,
                                query: hash,
                              }).catch(e => {
                                console.error('add meta: gnosis:error', e);
                              });
                            });
                          }
                        }
                      }
                    }
                  }
                }
              }).catch(() => {

              });
            }
          }
        }
        return;
      }
      default: {
        handleSharedEvents(message, sender, sendResponse);
        break;
      }
    }
  }
});