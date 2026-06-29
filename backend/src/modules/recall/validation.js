const { z } = require('zod');

const runSimulationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  triggeringLotId: z.string().uuid('Invalid lot ID'),
  params: z.record(z.any()).optional().default({}),
});

module.exports = {
  runSimulationSchema,
};
