const AppError = require("../utils/AppError");

const validate = (schema, property) => {
  return (req, res, next) => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message
      }));

      throw new AppError(
        "Validation failed",
        400,
        errors
      );
    }

    req[property] = result.data;

    next();
  };
};

module.exports = validate;