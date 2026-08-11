const asyncHandler = require("./utils/asyncHandler");

const testController = async (req, res, next) => {
  throw new Error("Async error caught!");
};

const wrappedController = asyncHandler(testController);

wrappedController(
  {},
  {},
  (error) => {
    console.log("Error received:", error.message);
  }
);