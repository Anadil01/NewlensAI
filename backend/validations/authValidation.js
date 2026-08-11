const {z} = require("zod");

const registerSchema = z.object({   // The request body must be an object matching this structure.
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
});


const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password must not exceed 128 characters")
});

module.exports = {
  registerSchema,
  loginSchema
};

