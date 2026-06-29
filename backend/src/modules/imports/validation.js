const { z } = require('zod');

const createImportSchema = z.object({
  filename: z.string().min(1).max(255),
  storage_key: z.string().min(1),
  cte_type: z.enum(['creation', 'receiving', 'transformation', 'shipping']),
});

module.exports = {
  createImportSchema,
};
