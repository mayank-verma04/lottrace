const { Worker } = require('bullmq');
const { connection } = require('../queues');
const knex = require('../../db/knex');
const { uploadBuffer } = require('../../lib/storage');
const { stringify } = require('csv-stringify/sync');
const logger = require('../../utils/logger');

const exportWorker = new Worker(
  'export-queue',
  async (job) => {
    logger.info(`Processing export job ${job.id}`);
    const { organizationId, userId, format } = job.data;
    
    // Fetch data
    const events = await knex('events')
      .where({ organization_id: organizationId })
      .orderBy('event_datetime', 'desc');

    if (!events.length) {
      return { status: 'empty' };
    }

    // Transform data to CSV
    const csvData = stringify(events, {
      header: true,
      columns: ['id', 'event_type', 'event_datetime', 'status', 'has_compliance_gaps'],
    });

    // Upload to S3
    const key = `exports/org_${organizationId}/export_${Date.now()}.csv`;
    await uploadBuffer(key, Buffer.from(csvData), 'text/csv');

    // Here we would normally record this in a database table or send a notification
    // For now we just return the key.

    logger.info(`Export job ${job.id} completed. Uploaded to ${key}`);
    return { key };
  },
  { connection }
);

exportWorker.on('failed', (job, err) => {
  logger.error(`Export job ${job.id} failed:`, err);
});

module.exports = exportWorker;
