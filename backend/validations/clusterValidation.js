const { z } = require("zod");

const clusterIdParamsSchema = z.object({
  id: z.uuid("Invalid cluster ID")
});

const clusterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(24).default(10)
});

module.exports = { clusterIdParamsSchema, clusterQuerySchema };
