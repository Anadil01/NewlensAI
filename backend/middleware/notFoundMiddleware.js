const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
  
    error.statusCode = 404;
  
    next(error);
  };
  
  module.exports = notFound;


  //What happens if the user requests: - GET /api/random-route -and no route exists?

  //Our error handler doesn't automatically know that the route doesn't exist.