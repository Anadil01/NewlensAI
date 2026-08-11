const { registerSchema } = require("./validations/authValidation");

const result = registerSchema.safeParse({
  name: " Anadil ",
  email: "ANADIL@GMAIL.COM",
  password: "password123"
});

console.log(result);