const { Worker } = require('bullmq');
const { connection } = require('../queues');
const knex = require('../../db/knex');
const { s3 } = require('../../lib/storage');
const { uploadBuffer } = require('../../lib/storage');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const env = require('../../config/env');
const { parse } = require('csv-parse');
const { v4: uuidv4 } = require('uuid');
const { computeEventHash } = require('../../utils/hashChain');
const { invalidateTraceCache } = require('../../modules/trace/trace.service');
const logger = require('../../utils/logger');
const crc32 = require('crc-32');

const BUCKET = env.S3_BUCKET || 'lottrace-dev';
const getAdvisoryLockId = (orgId) => Math.abs(crc32.str(orgId));

// ─── Required columns per CTE type ─────────────────────────
const REQUIRED_COLS = {
  creation: ['traceability_lot_code', 'product_name', 'quantity', 'uom', 'location_name', 'event_datetime'],
  receiving: ['traceability_lot_code', 'product_name', 'quantity', 'uom', 'location_name', 'event_datetime'],
  shipping: ['traceability_lot_code', 'product_name', 'quantity', 'uom', 'location_name', 'event_datetime'],
  transformation: ['output_lot_code', 'output_product_name', 'output_quantity', 'output_uom', 'location_name', 'event_datetime'],
};

/**
 * Validate a single row based on CTE type.
 * Returns array of error strings (empty if valid).
 */
const validateRow = (row, cteType, rowNum) => {
  const errors = [];
  const required = REQUIRED_COLS[cteType];

  for (const col of required) {
    const val = (row[col] || '').trim();
    if (!val) {
      errors.push(`Row ${rowNum}: Missing required field '${col}'`);
    }
  }

  // Validate quantity is numeric
  const qtyField = cteType === 'transformation' ? 'output_quantity' : 'quantity';
  const qtyVal = (row[qtyField] || '').trim();
  if (qtyVal && isNaN(Number(qtyVal))) {
    errors.push(`Row ${rowNum}: '${qtyField}' must be a number, got '${qtyVal}'`);
  }
  if (qtyVal && Number(qtyVal) <= 0) {
    errors.push(`Row ${rowNum}: '${qtyField}' must be positive`);
  }

  // Validate event_datetime is a valid date
  const dtVal = (row.event_datetime || '').trim();
  if (dtVal) {
    const parsed = new Date(dtVal);
    if (isNaN(parsed.getTime())) {
      errors.push(`Row ${rowNum}: 'event_datetime' is not a valid ISO date, got '${dtVal}'`);
    }
  }

  // For transformation, validate input_lot_codes present
  if (cteType === 'transformation') {
    const inputs = (row.input_lot_codes || '').trim();
    if (!inputs) {
      errors.push(`Row ${rowNum}: Missing required field 'input_lot_codes'`);
    }
  }

  return errors;
};

/**
 * Build a lookup cache for products and locations within an org.
 * Key: lowercase name, Value: DB row
 */
const buildLookupCaches = async (organizationId) => {
  const products = await knex('products')
    .where({ organization_id: organizationId, is_active: true })
    .select('id', 'name', 'default_uom', 'custom_kde_schema', 'is_ftl');

  const locations = await knex('locations')
    .where({ organization_id: organizationId, is_active: true })
    .select('id', 'name');

  const productMap = new Map();
  products.forEach(p => productMap.set(p.name.toLowerCase().trim(), p));

  const locationMap = new Map();
  locations.forEach(l => locationMap.set(l.name.toLowerCase().trim(), l));

  return { productMap, locationMap };
};

/**
 * Process a single creation/receiving/shipping row.
 * Creates lot (if needed) + event + event_lot_links inside given trx.
 */
const processStandardRow = async (trx, row, cteType, organizationId, userId, productMap, locationMap, prevHash) => {
  const product = productMap.get((row.product_name || '').toLowerCase().trim());
  if (!product) throw new Error(`Product '${row.product_name}' not found`);

  const location = locationMap.get((row.location_name || '').toLowerCase().trim());
  if (!location) throw new Error(`Location '${row.location_name}' not found`);

  const tlc = row.traceability_lot_code.trim();
  const quantity = Number(row.quantity);
  const uom = (row.uom || product.default_uom || 'kg').trim();

  // Find or create lot
  let lot = await trx('lots')
    .where({
      organization_id: organizationId,
      product_id: product.id,
      traceability_lot_code: tlc,
    })
    .whereNot('status', 'void')
    .first();

  if (!lot) {
    [lot] = await trx('lots').insert({
      id: uuidv4(),
      organization_id: organizationId,
      product_id: product.id,
      traceability_lot_code: tlc,
      quantity,
      uom,
      created_by: userId,
    }).returning('*');
  }

  // Build event payload
  const counterpartyInfo = {};
  if (row.counterparty_name) counterpartyInfo.name = row.counterparty_name.trim();
  if (row.counterparty_lot_code) counterpartyInfo.lotCode = row.counterparty_lot_code.trim();
  const hasCounterparty = Object.keys(counterpartyInfo).length > 0;

  const eventPayload = {
    eventType: cteType,
    locationId: location.id,
    eventDatetime: new Date(row.event_datetime.trim()).toISOString(),
    source: 'import',
    kdePayload: {},
    counterpartyInfo: hasCounterparty ? counterpartyInfo : null,
    inputs: cteType === 'receiving' ? [{ lotId: lot.id, quantity, uom }] : null,
    outputs: cteType !== 'receiving' ? [{ lotId: lot.id, quantity, uom }] : null,
  };

  // For creation: lot is output. For receiving: lot is input. For shipping: lot is output.
  const direction = cteType === 'receiving' ? 'input' : 'output';
  const recordHash = computeEventHash(eventPayload, prevHash);
  const eventId = uuidv4();

  const [event] = await trx('events').insert({
    id: eventId,
    organization_id: organizationId,
    event_type: cteType,
    location_id: location.id,
    counterparty_info: hasCounterparty ? JSON.stringify(counterpartyInfo) : null,
    event_datetime: new Date(row.event_datetime.trim()),
    recorded_by: userId,
    source: 'import',
    kde_payload: JSON.stringify({}),
    notes: (row.notes || '').trim() || null,
    record_hash: recordHash,
    prev_hash: prevHash,
    status: 'active',
  }).returning('*');

  // Create event_lot_link
  await trx('event_lot_links').insert({
    id: uuidv4(),
    event_id: eventId,
    lot_id: lot.id,
    direction,
    quantity,
    uom,
  });

  // Invalidate trace cache
  try {
    await invalidateTraceCache(organizationId, lot.id);
  } catch (_) {
    // Non-fatal — Redis might be down
  }

  return event;
};

/**
 * Process a single transformation row.
 * Creates output lot + resolves input lots + creates event with N input links and 1 output link.
 */
const processTransformationRow = async (trx, row, organizationId, userId, productMap, locationMap, prevHash) => {
  const product = productMap.get((row.output_product_name || '').toLowerCase().trim());
  if (!product) throw new Error(`Product '${row.output_product_name}' not found`);

  const location = locationMap.get((row.location_name || '').toLowerCase().trim());
  if (!location) throw new Error(`Location '${row.location_name}' not found`);

  const outputTlc = row.output_lot_code.trim();
  const outputQty = Number(row.output_quantity);
  const outputUom = (row.output_uom || product.default_uom || 'kg').trim();

  // Find or create output lot
  let outputLot = await trx('lots')
    .where({
      organization_id: organizationId,
      product_id: product.id,
      traceability_lot_code: outputTlc,
    })
    .whereNot('status', 'void')
    .first();

  if (!outputLot) {
    [outputLot] = await trx('lots').insert({
      id: uuidv4(),
      organization_id: organizationId,
      product_id: product.id,
      traceability_lot_code: outputTlc,
      quantity: outputQty,
      uom: outputUom,
      created_by: userId,
    }).returning('*');
  }

  // Resolve input lots by TLC
  const inputTlcs = row.input_lot_codes.split(',').map(s => s.trim()).filter(Boolean);
  if (inputTlcs.length === 0) throw new Error('No input_lot_codes provided');

  const inputLots = await trx('lots')
    .where({ organization_id: organizationId })
    .whereIn('traceability_lot_code', inputTlcs)
    .whereNot('status', 'void');

  if (inputLots.length !== inputTlcs.length) {
    const found = inputLots.map(l => l.traceability_lot_code);
    const missing = inputTlcs.filter(t => !found.includes(t));
    throw new Error(`Input lots not found: ${missing.join(', ')}`);
  }

  // Build event payload
  const inputs = inputLots.map(l => ({ lotId: l.id, quantity: Number(l.quantity), uom: l.uom }));
  const outputs = [{ lotId: outputLot.id, quantity: outputQty, uom: outputUom }];

  const eventPayload = {
    eventType: 'transformation',
    locationId: location.id,
    eventDatetime: new Date(row.event_datetime.trim()).toISOString(),
    source: 'import',
    kdePayload: {},
    counterpartyInfo: null,
    inputs,
    outputs,
  };

  const recordHash = computeEventHash(eventPayload, prevHash);
  const eventId = uuidv4();

  const [event] = await trx('events').insert({
    id: eventId,
    organization_id: organizationId,
    event_type: 'transformation',
    location_id: location.id,
    event_datetime: new Date(row.event_datetime.trim()),
    recorded_by: userId,
    source: 'import',
    kde_payload: JSON.stringify({}),
    notes: (row.notes || '').trim() || null,
    record_hash: recordHash,
    prev_hash: prevHash,
    status: 'active',
  }).returning('*');

  // Create event_lot_links: inputs + output
  const links = [];
  for (const inputLot of inputLots) {
    links.push({
      id: uuidv4(),
      event_id: eventId,
      lot_id: inputLot.id,
      direction: 'input',
      quantity: Number(inputLot.quantity),
      uom: inputLot.uom,
    });
  }
  links.push({
    id: uuidv4(),
    event_id: eventId,
    lot_id: outputLot.id,
    direction: 'output',
    quantity: outputQty,
    uom: outputUom,
  });

  await trx('event_lot_links').insert(links);

  // Invalidate trace cache for all affected lots
  const affectedLotIds = [...new Set(links.map(l => l.lot_id))];
  for (const lid of affectedLotIds) {
    try { await invalidateTraceCache(organizationId, lid); } catch (_) { /* non-fatal */ }
  }

  return event;
};

// ─── Worker Definition ──────────────────────────────────────
const importWorker = new Worker(
  'import-queue',
  async (job) => {
    const { importId, organizationId, storageKey, cteType, userId } = job.data;

    logger.info({ importId, cteType }, 'Starting import processing');

    // Mark as processing
    await knex('imports').where('id', importId).update({
      status: 'processing',
      started_at: knex.fn.now(),
    });

    try {
      // 1. Fetch CSV from S3
      const s3Response = await s3.send(new GetObjectCommand({
        Bucket: BUCKET,
        Key: storageKey,
      }));
      const stream = s3Response.Body;

      // 2. Parse all rows first
      const rows = [];
      const parser = stream.pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        relax_column_count: true,
      }));

      for await (const record of parser) {
        rows.push(record);
      }

      if (rows.length === 0) {
        await knex('imports').where('id', importId).update({
          status: 'failed',
          total_rows: 0,
          valid_rows: 0,
          error_rows: 0,
          completed_at: knex.fn.now(),
        });
        return { status: 'empty' };
      }

      // 3. Build lookup caches
      const { productMap, locationMap } = await buildLookupCaches(organizationId);

      // 4. Validate all rows upfront
      const validatedRows = [];
      const allErrors = [];

      rows.forEach((row, idx) => {
        const rowNum = idx + 2; // +2: 1-indexed + header row
        const rowErrors = validateRow(row, cteType, rowNum);
        if (rowErrors.length > 0) {
          allErrors.push(...rowErrors.map(msg => ({ row: rowNum, message: msg })));
        } else {
          validatedRows.push({ row, rowNum });
        }
      });

      // 5. Process valid rows — each in its own transaction for isolation
      let validCount = 0;
      const lockId = getAdvisoryLockId(organizationId);

      for (const { row, rowNum } of validatedRows) {
        try {
          await knex.transaction(async (trx) => {
            // Acquire advisory lock for hash chain consistency
            await trx.raw('SELECT pg_advisory_xact_lock(?)', [lockId]);

            // Get prev hash
            const prevEvent = await trx('events')
              .where({ organization_id: organizationId })
              .orderBy('created_at', 'desc')
              .first();
            const prevHash = prevEvent ? prevEvent.record_hash : 'GENESIS';

            if (cteType === 'transformation') {
              await processTransformationRow(trx, row, organizationId, userId, productMap, locationMap, prevHash);
            } else {
              await processStandardRow(trx, row, cteType, organizationId, userId, productMap, locationMap, prevHash);
            }
          });

          validCount++;
        } catch (err) {
          allErrors.push({ row: rowNum, message: err.message });
        }

        // Update job progress
        const processed = validCount + allErrors.length;
        await job.updateProgress(Math.round((processed / rows.length) * 100));
      }

      // 6. Upload error report if errors exist
      let errorReportKey = null;
      if (allErrors.length > 0) {
        errorReportKey = `imports/org_${organizationId}/errors_${importId}.json`;
        await uploadBuffer(
          errorReportKey,
          Buffer.from(JSON.stringify(allErrors, null, 2)),
          'application/json'
        );
      }

      // 7. Determine final status
      const errorCount = allErrors.length;
      let finalStatus;
      if (validCount === 0 && errorCount > 0) {
        finalStatus = 'failed';
      } else if (errorCount > 0) {
        finalStatus = 'complete_with_errors';
      } else {
        finalStatus = 'complete';
      }

      // 8. Update import record
      await knex('imports').where('id', importId).update({
        status: finalStatus,
        total_rows: rows.length,
        valid_rows: validCount,
        error_rows: errorCount,
        error_report_key: errorReportKey,
        completed_at: knex.fn.now(),
      });

      // 9. Create notification for the user who started the import
      try {
        const statusLabel = finalStatus === 'complete' ? 'completed successfully'
          : finalStatus === 'complete_with_errors' ? 'completed with errors'
          : 'failed';

        await knex('notifications').insert({
          id: uuidv4(),
          organization_id: organizationId,
          user_id: userId,
          type: 'import_complete',
          title: 'Import ' + statusLabel,
          message: `Your ${cteType} CSV import "${job.data.storageKey.split('/').pop()}" ${statusLabel}. ${validCount} rows imported, ${errorCount} errors.`,
          link: `/imports`,
          entity_type: 'import',
          entity_id: importId,
        });
      } catch (notifErr) {
        logger.warn({ err: notifErr }, 'Failed to create import notification');
      }

      logger.info({ importId, finalStatus, validCount, errorCount }, 'Import processing complete');
      return { status: finalStatus, validCount, errorCount };

    } catch (err) {
      logger.error({ err, importId }, 'Import processing failed');
      await knex('imports').where('id', importId).update({
        status: 'failed',
        completed_at: knex.fn.now(),
      });
      throw err;
    }
  },
  {
    connection,
    concurrency: 2,
    limiter: { max: 5, duration: 60000 },
  }
);

importWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err: err.message }, 'Import job failed');
});

importWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Import job completed');
});

module.exports = importWorker;
