const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");

const authService = require("../services/authService");




exports.registerUser = asyncHandler(
  async (req, res) => {
    const result =
      await authService.registerUser(req.body);

    return ApiResponse.success(
      res,
      result,
      "User registered successfully",
      201
    );
  }
);


exports.loginUser = asyncHandler(
  async (req, res) => {
    const result =
      await authService.loginUser(req.body);

    return ApiResponse.success(
      res,
      result,
      "Login successful"
    );
  }
);
