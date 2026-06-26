const { z } = require('zod');

const updateOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100).optional(),
  timezoneDefault: z.string().min(1).max(50).optional(),
  uomDefault: z.string().min(1).max(20).optional(),
  customSettings: z.record(z.unknown()).optional(),
}).strict();

module.exports = {
  updateOrgSchema,
};
