const axios = require('axios'),
  queue = require('./utils/queue'),
  db = require('./utils/db');

queue.syncQueue.process(async (job, done) => {
  const {event, ...data} = job.data || {};

  switch (event) {
    case queue.EVENTS.NEW: {
      const {cid} = data || {};
      console.log('worker:cid:', cid);

      axios.post(`${process.env.IPFS_URL}/cat?arg=${encodeURIComponent(cid)}`).then(res => {
        const content = res && res.data;
        db.Cache.findOneAndUpdate({
          _id: cid
        }, {
          _id: cid,
          data: content,
        }, {
          new: true, upsert: true
        }).then(() => {
          console.log('updated cache:', cid);
        }).catch(e => {
          console.error('failed to update cache:', cid);
        });
      })
      break;
    }
    default:
      // Nothing to process!
      break;
  }

  done();
});
