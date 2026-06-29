const { Worker } = require('bullmq');
const { connection } = require('../queues');
const knex = require('../../db/knex');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const env = require('../../config/env');
const { parse } = require('csv-parse');

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

const worker = new Worker(
  'import-queue',
  async (job) => {
    const { importId, organizationId, storageKey, cteType, userId } = job.data;

    await knex('imports').where('id', importId).update({ status: 'processing', started_at: knex.fn.now() });

    try {
      // 1. Fetch file stream from S3
      const getObjectParams = { Bucket: env.AWS_S3_BUCKET, Key: storageKey };
      const s3Response = await s3.send(new GetObjectCommand(getObjectParams));
      const stream = s3Response.Body;

      // 2. Parse CSV
      let validRowsCount = 0;
      let errorRowsCount = 0;
      const errors = [];

      const parser = stream.pipe(parse({ columns: true, skip_empty_lines: true }));

      for await (const record of parser) {
        try {
          // Validate structure based on cteType here
          // Simplified processing for this MVP...

          // Insert the event
          // (Mock implementation of event creation for the CSV rows)
          validRowsCount++;
        } catch (err) {
          errorRowsCount++;
          errors.push({ record, error: err.message });
        }
      }

      // 3. Mark complete
      await knex('imports').where('id', importId).update({
        status: errorRowsCount > 0 ? (validRowsCount > 0 ? 'complete_with_errors' : 'failed') : 'complete',
        valid_rows: validRowsCount,
        error_rows: errorRowsCount,
        total_rows: validRowsCount + errorRowsCount,
        completed_at: knex.fn.now()
      });

      // 4. Save error report if there are errors
      if (errors.length > 0) {
        // Mock saving error report to S3 and updating error_report_key
      }

    } catch (err) {
      await knex('imports').where('id', importId).update({
        status: 'failed',
        completed_at: knex.fn.now()
      });
      throw err;
    }
  },
  { connection }
);

worker.on('failed', (job, err) => {
  console.error(`Import Job ${job.id} failed:`, err);
});

module.exports = worker;
