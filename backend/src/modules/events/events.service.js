const db = require('../../db/knex');
const { v4: uuidv4 } = require('uuid');
const { computeEventHash } = require('../../utils/hashChain');
const AppError = require('../../utils/AppError');
const crc32 = require('crc-32');

const getAdvisoryLockId = (orgId) => Math.abs(crc32.str(orgId));

const checkComplianceGaps = async (data, organizationId) => {
  const lotIds = [...(data.inputs || []), ...(data.outputs || [])].map(l => l.lotId);
  if (lotIds.length === 0) return null;
  
  const lots = await db('lots')
    .join('products', 'lots.product_id', 'products.id')
    .whereIn('lots.id', lotIds)
    .andWhere('lots.organization_id', organizationId)
    .select('products.is_ftl', 'products.custom_kde_schema');

  const gaps = [];
  let isFtl = false;
  
  lots.forEach(lot => {
    if (lot.is_ftl) isFtl = true;
    if (lot.custom_kde_schema) {
      const schema = typeof lot.custom_kde_schema === 'string' ? JSON.parse(lot.custom_kde_schema) : lot.custom_kde_schema;
      schema.forEach(field => {
        if (field.required && !data.kdePayload?.[field.name]) {
          if (!gaps.find(g => g.field === field.name)) {
            gaps.push({ field: field.name, message: `${field.label || field.name} is required` });
          }
        }
      });
    }
  });

  return gaps.length > 0 ? JSON.stringify(gaps) : null;
};

const createEvent = async (data, organizationId, userId, overrideStatus = 'active', supersedesEventId = null) => {
  if (data.idempotencyKey) {
    const existing = await db('events').where({ idempotency_key: data.idempotencyKey, organization_id: organizationId }).first();
    if (existing) return existing;
  }

  const lockId = getAdvisoryLockId(organizationId);
  
  return await db.transaction(async (trx) => {
    // Acquire org-level lock to prevent concurrent hash chain generation
    await trx.raw('SELECT pg_advisory_xact_lock(?)', [lockId]);

    const prevEvent = await trx('events')
      .where({ organization_id: organizationId })
      .orderBy('created_at', 'desc')
      .first();

    const prevHash = prevEvent ? prevEvent.record_hash : 'GENESIS';
    const complianceGaps = await checkComplianceGaps(data, organizationId);
    
    const eventPayload = {
      eventType: data.eventType,
      locationId: data.locationId,
      eventDatetime: data.eventDatetime,
      source: data.source,
      kdePayload: data.kdePayload,
      counterpartyInfo: data.counterpartyInfo,
      inputs: data.inputs,
      outputs: data.outputs,
    };

    const recordHash = computeEventHash(eventPayload, prevHash);
    const eventId = uuidv4();

    const [event] = await trx('events').insert({
      id: eventId,
      organization_id: organizationId,
      event_type: data.eventType,
      location_id: data.locationId || null,
      counterparty_info: data.counterpartyInfo ? JSON.stringify(data.counterpartyInfo) : null,
      event_datetime: data.eventDatetime,
      recorded_by: userId,
      source: data.source,
      kde_payload: JSON.stringify(data.kdePayload || {}),
      compliance_gaps: complianceGaps,
      notes: data.notes || null,
      idempotency_key: data.idempotencyKey || null,
      record_hash: recordHash,
      prev_hash: prevHash,
      status: overrideStatus,
      supersedes_event_id: supersedesEventId,
    }).returning('*');

    const links = [];
    if (data.inputs) {
      data.inputs.forEach(input => {
        links.push({
          id: uuidv4(),
          event_id: eventId,
          lot_id: input.lotId,
          direction: 'input',
          quantity: input.quantity,
          uom: input.uom,
        });
      });
    }

    if (data.outputs) {
      data.outputs.forEach(output => {
        links.push({
          id: uuidv4(),
          event_id: eventId,
          lot_id: output.lotId,
          direction: 'output',
          quantity: output.quantity,
          uom: output.uom,
        });
      });
    }

    if (links.length > 0) {
      await trx('event_lot_links').insert(links);
    }

    return event;
  });
};

const getEvents = async (query, organizationId) => {
  const { page, limit, eventType, status, locationId, dateFrom, dateTo } = query;
  const offset = (page - 1) * limit;

  let queryBuilder = db('events').where({ 'events.organization_id': organizationId });

  if (eventType) queryBuilder = queryBuilder.where({ event_type: eventType });
  if (status) queryBuilder = queryBuilder.where({ status });
  if (locationId) queryBuilder = queryBuilder.where({ location_id: locationId });
  if (dateFrom) queryBuilder = queryBuilder.where('event_datetime', '>=', dateFrom);
  if (dateTo) queryBuilder = queryBuilder.where('event_datetime', '<=', dateTo);

  const [countResult] = await queryBuilder.clone().count('id as count');
  const total = parseInt(countResult.count, 10);

  const events = await queryBuilder
    .select(
      'events.*',
      db.raw(`(
        SELECT json_agg(json_build_object('id', lots.id, 'traceabilityLotCode', lots.traceability_lot_code, 'direction', ell.direction, 'quantity', ell.quantity, 'uom', ell.uom))
        FROM event_lot_links ell
        JOIN lots ON lots.id = ell.lot_id
        WHERE ell.event_id = events.id
      ) as lot_links`)
    )
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    data: events,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    }
  };
};

const getEventById = async (eventId, organizationId) => {
  const event = await db('events').where({ id: eventId, organization_id: organizationId }).first();
  if (!event) throw new AppError('Event not found', 'NOT_FOUND', 404);

  const links = await db('event_lot_links')
    .join('lots', 'lots.id', 'event_lot_links.lot_id')
    .where({ event_id: eventId })
    .select('event_lot_links.*', 'lots.traceability_lot_code', 'lots.product_id');

  event.inputs = links.filter(l => l.direction === 'input');
  event.outputs = links.filter(l => l.direction === 'output');

  return event;
};

const voidEvent = async (eventId, voidReason, organizationId) => {
  return await db.transaction(async (trx) => {
    const event = await trx('events').where({ id: eventId, organization_id: organizationId }).first();
    if (!event) throw new AppError('Event not found', 'NOT_FOUND', 404);
    if (event.status !== 'active') throw new AppError('Event is not active', 'EVENT_IMMUTABLE', 409);

    const [voided] = await trx('events')
      .where({ id: eventId })
      .update({ status: 'void', void_reason: voidReason })
      .returning('*');
    return voided;
  });
};

const amendEvent = async (eventId, data, organizationId, userId) => {
  return await db.transaction(async (trx) => {
    const oldEvent = await trx('events').where({ id: eventId, organization_id: organizationId }).first();
    if (!oldEvent) throw new AppError('Event not found', 'NOT_FOUND', 404);
    if (oldEvent.status !== 'active') throw new AppError('Event is not active', 'EVENT_IMMUTABLE', 409);

    // Create the new event that supersedes the old one
    const newEvent = await createEvent(data, organizationId, userId, 'active', eventId);

    // Mark the old event as amended
    await trx('events')
      .where({ id: eventId })
      .update({ status: 'amended', void_reason: data.voidReason });

    return newEvent;
  });
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  voidEvent,
  amendEvent,
};
