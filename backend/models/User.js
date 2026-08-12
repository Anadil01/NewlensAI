const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  bookmarks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Story"
    }
  ]
});

module.exports = mongoose.model("User", userSchema);