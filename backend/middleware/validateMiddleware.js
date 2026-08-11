const AppError = require("../utils/AppError");

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }));

      const error = new AppError("Validation failed", 400);

      error.code = "VALIDATION_ERROR";
      error.errors = errors;

      return next(error);
    }

    req[source] = result.data;

    next();
  };
};

module.exports = validate;