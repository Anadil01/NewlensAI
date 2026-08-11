const AppError = require("./utils/AppError");

const error = new AppError("Story not found", 404);

console.log("Message:", error.message);
console.log("Status:", error.statusCode);
console.log("Operational:", error.isOperational);
console.log("Instance of Error:", error instanceof Error);
console.log("Instance of AppError:", error instanceof AppError);