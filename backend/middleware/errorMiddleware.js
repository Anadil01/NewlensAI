const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
  
    const response = {
      success: false,
      message: err.message || "Internal server error"
    };
  
    if (err.code) {
      response.code = err.code;
    }
  
    if (err.errors) {
      response.errors = err.errors;
    }
  
    res.status(statusCode).json(response);
  };
  
  module.exports = errorHandler;

// The first parameter tells Express:

// "This is an error-handling middleware."