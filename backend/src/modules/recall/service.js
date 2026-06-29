const db = require('../../db/knex');
const traceService = require('../trace/trace.service');
const AppError = require('../../utils/AppError');

const runSimulation = async (organizationId, userId, payload) => {
  const { name, triggeringLotId, params } = payload;
  
  // Verify lot
  const lot = await db('lots').where({ id: triggeringLotId, organization_id: organizationId }).first();
  if (!lot) throw new AppError('Lot not found', 'NOT_FOUND', 404);
  
  // Create simulation record
  const [simulation] = await db('recall_simulations').insert({
    organization_id: organizationId,
    name,
    triggering_lot_id: triggeringLotId,
    params,
    status: 'running',
    run_by: userId
  }).returning('*');
  
  try {
    const traceResult = await traceService.fullTrace(triggeringLotId, organizationId);
    
    const affectedLots = traceResult.nodes.length;
    const eventIds = [...new Set(traceResult.edges.map(e => e.eventId))];
    
    let locationsCount = 0;
    if (eventIds.length > 0) {
        const locs = await db('events').whereIn('id', eventIds).distinct('location_id').count('location_id as count').first();
        locationsCount = parseInt(locs.count, 10);
    }
    const productsCount = new Set(traceResult.nodes.map(n => n.productId)).size;

    const resultSummary = {
      affectedLots,
      affectedLocations: locationsCount,
      affectedProducts: productsCount,
      hops: traceResult.hops
    };
    
    const [completedSim] = await db('recall_simulations')
      .where({ id: simulation.id })
      .update({
        status: 'complete',
        result_summary: resultSummary,
        completed_at: db.fn.now()
      }).returning('*');
      
    return completedSim;
  } catch (err) {
    await db('recall_simulations').where({ id: simulation.id }).update({
      status: 'failed',
      completed_at: db.fn.now()
    });
    throw err;
  }
};

const listSimulations = async (organizationId, pagination) => {
  const { limit, offset } = pagination;
  
  const query = db('recall_simulations')
    .where({ organization_id: organizationId })
    .orderBy('run_at', 'desc');
    
  const total = await query.clone().count('id as count').first();
  const data = await query.limit(limit).offset(offset);
  
  return { data, total: parseInt(total.count, 10) };
};

const getSimulation = async (organizationId, id) => {
  const sim = await db('recall_simulations').where({ id, organization_id: organizationId }).first();
  if (!sim) throw new AppError('Simulation not found', 'NOT_FOUND', 404);
  return sim;
};

module.exports = {
  runSimulation,
  listSimulations,
  getSimulation
};
