const knex = require('../../db/knex');
const { importQueue } = require('../../jobs/queues');
const AppError = require('../../utils/AppError');

const createImport = async ({ organizationId, userId, filename, storage_key, cte_type }) => {
  const [newImport] = await knex('imports')
    .insert({
      organization_id: organizationId,
      created_by: userId,
      filename,
      storage_key,
      cte_type,
      status: 'pending',
    })
    .returning('*');

  // Enqueue job for background processing
  const job = await importQueue.add('process-import', {
    importId: newImport.id,
    organizationId,
    storageKey: storage_key,
    cteType: cte_type,
    userId,
  });

  // Update record with Job ID
  await knex('imports')
    .where('id', newImport.id)
    .update({ job_id: job.id });

  newImport.job_id = job.id;
  return newImport;
};

const listImports = async (organizationId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const [countResult] = await knex('imports')
    .where('organization_id', organizationId)
    .count('id as total');
  const total = parseInt(countResult.total, 10);

  const data = await knex('imports')
    .where('organization_id', organizationId)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    data,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getImportById = async (organizationId, id) => {
  const importJob = await knex('imports')
    .where({ organization_id: organizationId, id })
    .first();

  if (!importJob) {
    throw new AppError('Import not found', 404);
  }

  return importJob;
};

module.exports = {
  createImport,
  listImports,
  getImportById,
};
