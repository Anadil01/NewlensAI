const express = require("express");
const validate = require("../middleware/validateMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");

const {
  registerSchema,
  loginSchema
} = require("../validations/authValidation");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  registerUser
);


router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  loginUser
);

module.exports = router;