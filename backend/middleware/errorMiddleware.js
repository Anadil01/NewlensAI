const ApiResponse = require("../utils/ApiResponse");
const config = require("../config/env");


const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Prisma: unique constraint violation
  if (err.code === "P2002") {
    return ApiResponse.error(
      res,
      "A record with this value already exists",
      409
    );
  }

  // Prisma: record not found
  if (err.code === "P2025") {
    return ApiResponse.error(
      res,
      "Resource not found",
      404
    );
  }

  // Operational error
  if (err.isOperational) {
    return ApiResponse.error(
      res,
      err.message,
      err.statusCode || 500,
      err.errors
    );
  }

  // Unexpected error
  const message =
  config.nodeEnv === "production"
    ? "Internal Server Error"
    : err.message;

  return ApiResponse.error(
    res,
    message,
    err.statusCode || 500
  );
};

module.exports = errorHandler;