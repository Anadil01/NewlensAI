class ApiResponse {
  static success(
    res,
    data = null,
    message = "Success",
    statusCode = 200
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static error(
    res,
    message = "Something went wrong",
    statusCode = 500,
    errors = null
  ) {
    const response = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;