const prisma = require("../utils/prisma");
const AppError = require("../utils/AppError");

const requireAdmin = async (req, res, next) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.user
    },
    select: {
      role: true
    }
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role !== "ADMIN") {
    throw new AppError("Forbidden", 403);
  }

  next();
};

module.exports = requireAdmin;