const Queue = require('bull');

function QueueUtils() {
}

const self = QueueUtils.prototype;

QueueUtils.prototype.QUEUE_NAMES = {
    SYNC: 'sync',
};

QueueUtils.prototype.EVENTS = {
    NEW: 'NEW',
};

QueueUtils.prototype.syncQueue = new Queue(self.QUEUE_NAMES.SYNC, process.env.REDIS_URL);

module.exports = new QueueUtils();
