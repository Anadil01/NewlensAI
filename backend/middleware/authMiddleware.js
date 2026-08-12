const jwt = require("jsonwebtoken");

const config = require("../config/env");
const AppError = require("../utils/AppError");

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Authentication required", 401);
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Invalid authorization header", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (error) {
    throw new AppError("Invalid or expired token", 401);
  }

  if (!decoded.sub) {
    throw new AppError("Invalid token", 401);
  }

  req.user = decoded.sub;

  next();
};

module.exports = protect;