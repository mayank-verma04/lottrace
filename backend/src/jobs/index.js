const exportWorker = require('./workers/export-generator');
const logger = require('../utils/logger');

const startWorkers = () => {
  logger.info('Starting BullMQ workers...');
  // Workers are started automatically upon instantiation
};

module.exports = {
  startWorkers,
};
