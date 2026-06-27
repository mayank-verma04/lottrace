const { z } = require('zod');

const traceParamsSchema = z.object({
  lotId: z.string().uuid('Invalid lot ID'),
});

module.exports = {
  traceParamsSchema,
};
