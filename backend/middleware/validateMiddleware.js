const AppError = require("../utils/AppError");

const validate = (schema, property = "body") => {
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

    // Express 5 exposes req.query (and req.params) through read-only getters,
    // so a plain `req[property] = ...` assignment throws a TypeError. Redefine
    // the property on the request instance to hold the validated/coerced data.
    Object.defineProperty(req, property, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true
    });

    next();
  };
};

module.exports = validate;