const User = require("../models/User");
const AppError = require("../utils/AppError");

const requireAdmin = async (req, res, next) => {
  const user = await User.findById(req.user).select("role");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== "admin") {
    throw new AppError("Forbidden", 403);
  }

  next();
};

module.exports = requireAdmin;