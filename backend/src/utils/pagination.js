/**
 * Reusable pagination helper.
 * Takes a Knex query builder and pagination params,
 * returns { data, pagination } matching the API envelope.
 *
 * @param {import('knex').Knex.QueryBuilder} query - Knex query (before limit/offset)
 * @param {{ page?: number, limit?: number }} params
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
const paginate = async (query, { page = 1, limit = 20 } = {}) => {
  // Clamp limit
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * safeLimit;

  // Clone query for count (before limit/offset applied)
  const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();
  const [countResult, data] = await Promise.all([
    countQuery,
    query.limit(safeLimit).offset(offset),
  ]);

  const total = parseInt(countResult.total, 10);
  const totalPages = Math.ceil(total / safeLimit);

  return {
    data,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  };
};

module.exports = { paginate };
