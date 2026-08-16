const prisma = require("../utils/prisma");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AppError = require("../utils/AppError");
const config = require("../config/env");

const generateToken = (id) => {
  return jwt.sign(
    {
      sub: id
    },
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
  const normalizedEmail = email.toLowerCase().trim();

  const userExists = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (userExists) {
    throw new AppError(
      "User already exists",
      409
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash: hashedPassword
    }
  });

  return {
    _id: user.id,
    name: user.name,
    email: user.email,
    token: generateToken(user.id)
  };
};

const loginUser = async ({
  email,
  password
}) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (
    !user ||
    !(await bcrypt.compare(
      password,
      user.passwordHash
    ))
  ) {
    throw new AppError(
      "Invalid credentials",
      401
    );
  }

  return {
    _id: user.id,
    name: user.name,
    email: user.email,
    token: generateToken(user.id)
  };
};

module.exports = {
  registerUser,
  loginUser
};