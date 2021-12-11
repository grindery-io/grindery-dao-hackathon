const express = require('express'),
  db = require('./utils/db'),
  queue = require('./utils/queue');

const api = express.Router();

api.post('/new', (req, res) => {
  const {cid} = req.body;
  if(cid) {
    db.Cache.findOneAndUpdate({
      _id: cid
    }, {
      _id: cid
    }, {
      new: true, upsert: true
    }).then(() => {
      queue.syncQueue.add({
        event: queue.EVENTS.NEW,
        cid,
      });
    }).catch(e => {
      console.error('failed to update cache:', cid);
    });
    return res.json({message: 'Received.'})
  }
  res.status(400).json({message: 'Bad request.'})
});

api.get('/payment-request', (req, res) => {
  const {account} = req.query;
  let filter = {
    'data.meta.format': 'PaymentRequest',
  };
  if(account) {
    filter.$or = [
      {'data.recipient.address': account},
      {'data.recipient.name': account},
      {'data.payer.address': account},
      {'data.payer.name': account},
      {'data.creator.address': account},
      {'data.creator.name': account},
    ];
  }
  return db.Cache.find(filter).then(results => {
    res.json({
      items: results || [],
    });
  }).catch(e => {
    res.status(500).json({message: 'Something went wrong!'});
  });
});

api.get('/batch-payment', (req, res) => {
  const {id} = req.query;
  let filter = {
    'data.meta.format': 'BatchPayment',
  };
  if(id) {
    filter.$or = [
      {'data.batchAddress': id},
      {'data.transactionHash': id},
    ];
  }
  return db.Cache.find(filter).then(results => {
    res.json({
      items: results || [],
    });
  }).catch(e => {
    res.status(500).json({message: 'Something went wrong!'});
  });
});

module.exports = api;