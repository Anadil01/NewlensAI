const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const ApiResponse = require("../utils/ApiResponse");

const generateToken = (userId) => {
  return jwt.sign({sub: userId.toString()}, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
};

exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new AppError("User already exists", 400);
  }

  const salt = await bcrypt.genSalt(10);

  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword
  });

  return ApiResponse.success(
    res,
    {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    },
    "User registered successfully",
    201
  );

});



exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (
    user &&
    (await bcrypt.compare(password, user.password))
  ) {
    return ApiResponse.success(
      res,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      },
      "Login successful"
    );
  }

  throw new AppError("Invalid credentials", 401);
});
