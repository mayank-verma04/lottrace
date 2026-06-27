const { z } = require('zod');

const getAuditLogQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  actorId: z.string().uuid().optional(),
});

module.exports = {
  getAuditLogQuerySchema,
};
