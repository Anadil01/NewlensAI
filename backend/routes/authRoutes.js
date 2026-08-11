const express = require("express");
const validate = require("../middleware/validateMiddleware");
const {
  registerSchema,
  loginSchema
} = require("../validations/authValidation");

const {
  registerUser,
  loginUser
} = require("../controllers/authController");

const router = express.Router();

router.post("/register",validate(registerSchema), registerUser);
router.post("/login",validate(loginSchema), loginUser);

module.exports = router;