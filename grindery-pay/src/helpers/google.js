/*global chrome*/
import axios from 'axios';

export const connectToGoogle = (interactive=true) => {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({interactive}, token => {
      if(token) {
        resolve(token);
      } else {
        reject(null);
      }
    });
  });
};

export const getAuthToken = () => {
  return connectToGoogle(false);
};

export const clearAuthToken = token => {
  return new Promise((resolve, reject) => {
    chrome.identity.removeCachedAuthToken({token},() => {
      resolve(null);
    });
  });
};

export const getSpreadsheets = token => {
  return axios.get(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet'")}`, {
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  }).then(res => {
    const data = res && res.data && res.data.files || null;
    if(data && Array.isArray(data)) {
      return data;
    }
    throw new Error('Failed to read sheet data');
  }).catch(e => {
    const statusCode = e && e.response && e.response.status;
    if(statusCode === 401) {
      clearAuthToken(token).catch(() => {});
    }
    throw new Error('Failed to read sheet data');
  });
};

export const getSpreadsheet = (token, spreadsheetId) => {
  return axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`, {
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  }).then(res => {
    const data = res && res.data || null;
    if(data) {
      const title = data.properties && data.properties.title || '';
      const url = data.spreadsheetUrl || '';
      const sheets = (data.sheets || []).map(sheet => sheet && sheet.properties && ({
        index: sheet.properties.index,
        id: sheet.properties.sheetId,
        title: sheet.properties.title,
        sheetType: sheet.properties.sheetType,
        ...(sheet.properties.gridProperties?{
          rows: sheet.properties.gridProperties.rowCount || null,
          columns: sheet.properties.gridProperties.columnCount,
        }:{}),
      })).filter(i => i);
      return {
        id: spreadsheetId,
        title,
        url,
        sheets,
      }
    }
    throw new Error('Failed to read spreadsheet');
  }).catch(e => {
    throw new Error('Failed to read spreadsheet');
  });
};

export const getSpreadsheetData = (token, spreadsheetId, sheetTitle) => {
  return axios.get(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(`${sheetTitle}!A1:Z1000`)}?majorDimension=ROWS`, {
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  }).then(res => {
    const data = res && res.data && res.data.values || [];
    if(data && Array.isArray(data)) {
      return data;
    }
    throw new Error('Failed to read sheet data');
  }).catch(e => {
    throw new Error('Failed to read sheet data');
  });
};

export const updateSpreadsheetData = (token, spreadsheetId, data) => {
  return axios.post(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`, data, {
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    }
  }).then(res => {
    return res && res.data;
  }).catch(e => {
    throw new Error('Failed to update spreadsheet data');
  });
};
