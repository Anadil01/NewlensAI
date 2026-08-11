const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z
  .string()
  .refine(
    (id) => mongoose.Types.ObjectId.isValid(id),
    "Invalid story ID"
  );

const storyIdParamsSchema = z.object({
  id: objectIdSchema
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