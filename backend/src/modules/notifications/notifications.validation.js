const { z } = require('zod');

const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  unreadOnly: z.enum(['true', 'false']).optional(),
});

const markNotificationReadParamsSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  getNotificationsQuerySchema,
  markNotificationReadParamsSchema,
};
