const { z } = require("zod");

const storyIdParamsSchema = z.object({
  id: z.uuid("Invalid story ID")
});

const storyQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(24)
    .default(6),

  search: z
    .string()
    .trim()
    .default("")
});

module.exports = {
  storyIdParamsSchema,
  storyQuerySchema
};