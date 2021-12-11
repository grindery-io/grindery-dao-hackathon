import axios from 'axios';

import {parseBatchPaymentType, parsePaymentType} from '../../utils';

const createFormData = () => {
  try {
    return new FormData();
  } catch (e) {
    const FormData = require('form-data');
    return new FormData();
  }
};

const createBlobOrBuffer = data => {
  try {
    return new Blob([data || ''], {
      type: 'text/plain'
    });
  } catch (e) {
    return Buffer.from(data || '');
  }
}

export default (url='http://localhost:5001/api/v0', options) => {
  const {username=null, password=null, indexUrl='https://grindery-index.herokuapp.com'} = options || {};
  let headers = {};
  if(username && password) {
    headers.Authorization = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');
  }

  const client = {
    add: data => {
      let formData = createFormData();
      formData.append('file', createBlobOrBuffer(JSON.stringify(data)));
      let formDataHeaders = {};
      if(typeof formData.getHeaders === 'function') {
        formDataHeaders = formData.getHeaders();
      } else if(formData._boundary) {
        formDataHeaders['Content-Type']= `multipart/form-data; boundary=${formData._boundary}`;
      }

      return axios.post(`${url}/add`, formData, {
        headers: {
          ...formDataHeaders,
          ...headers,
        }
      }).then(res => {
        if(res && res.data) {
          let result = {};
          for (const [dest, source] of [
            ['bytes', 'Bytes'],
            ['name', 'Name'],
            ['hash', 'Hash'],
            ['cid', 'Hash'],
            ['size', 'Size'],
          ]) {
            if(res.data[source]) {
              result[dest] = res.data[source];
            }
          }

          if(Object.keys(result).length) {
            if(result.cid && indexUrl) {
              axios.post(`${indexUrl}/api/v0/new`, {
                cid: result.cid,
              }).catch(e => {
                console.error('Failed to index:', result.cid);
              });
            }
            return result;
          }
        }
        throw new Error('Empty response');
      });
    },
    get: hash => {
      return axios.post(`${url}/cat?arg=${encodeURIComponent(hash)}`).then(res => {
        return res && res.data;
      });
    },
  };
  return {
    client,
    PaymentRequest: {
      add: async data => {
        return client.add(
          parsePaymentType(data, true)
        );
      },
    },
    BatchPayment: {
      add: async data => {
        return client.add(
          parseBatchPaymentType(data)
        );
      },
    },
  };
};
