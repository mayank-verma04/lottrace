const { Queue } = require('bullmq');
const env = require('../config/env');
const IORedis = require('ioredis');

// Shared Redis connection for BullMQ
const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const exportQueue = new Queue('export-queue', { connection });

module.exports = {
  connection,
  exportQueue,
};
