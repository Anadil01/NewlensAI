const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AppError = require("../utils/AppError");
const config = require("../config/env");

const generateToken = (id) => {
    return jwt.sign(
      { id },
      config.jwtSecret,
      {
        expiresIn: "7d"
      }
    );
  };

  const registerUser = async ({
    name,
    email,
    password
  }) => {
    const userExists = await User.findOne({ email });
  
    if (userExists) {
      throw new AppError(
        "User already exists",
        409
      );
    }
  
    const salt = await bcrypt.genSalt(10);
  
    const hashedPassword = await bcrypt.hash(
      password,
      salt
    );
  
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });
  
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    };
  };


  const loginUser = async ({
    email,
    password
  }) => {
    const user = await User.findOne({
      email
    }).select("+password");
  
    if (
      !user ||
      !(await bcrypt.compare(
        password,
        user.password
      ))
    ) {
      throw new AppError(
        "Invalid credentials",
        401
      );
    }
  
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    };
  };

  module.exports = {
    registerUser,
    loginUser
  };