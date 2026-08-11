const mongoose = require("mongoose");
const config = require("./env");


const connectDB = async () => {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;
