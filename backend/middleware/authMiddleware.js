const jwt = require("jsonwebtoken");
const config = require("../config/env");
const AppError = require("../utils/AppError");

const protect = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token || !token.startsWith("Bearer ")) {
    throw new AppError("Authentication required", 401);
  }

  try {
    token = token.split(" ")[1];

    const decoded = jwt.verify(
      token,
      config.jwtSecret
    );

    if (!decoded.sub) {
      throw new AppError("Invalid token", 401);
    }

    req.user = decoded.sub;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      "Invalid or expired token",
      401
    );
  }
};

module.exports = protect;