const exportWorker = require('./workers/export-generator');
const importWorker = require('./workers/import-processor');
const emailWorker = require('./workers/email-sender');
const hashVerifyWorker = require('./workers/hash-verifier');
const logger = require('../utils/logger');
const { emailQueue, hashVerifyQueue } = require('./queues');

const startWorkers = async () => {
  logger.info('Starting BullMQ workers and scheduling cron jobs...');
  // Workers are started automatically upon instantiation
  
  // Schedule nightly hash verifier (runs at midnight UTC)
  await hashVerifyQueue.add('hash_verify_nightly', {}, {
    repeat: { pattern: '0 0 * * *' },
    jobId: 'hash_verify_nightly_job' // Ensures uniqueness
  });
  
  // Schedule weekly compliance digest (runs Friday at 5 PM UTC)
  await emailQueue.add('weekly_compliance_digest', { type: 'compliance_digest' }, {
    repeat: { pattern: '0 17 * * 5' },
    jobId: 'weekly_compliance_digest_job' // Ensures uniqueness
  });
};

module.exports = {
  startWorkers,
};
