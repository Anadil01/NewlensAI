const errorHandler = (err, req, res, next) =>{
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error"
    });
   
}

module.exports = errorHandler;

// The first parameter tells Express:

// "This is an error-handling middleware."