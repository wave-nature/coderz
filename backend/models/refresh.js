const mongoose = require("mongoose");

const refreshSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: [true, "token is required"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Refresh", refreshSchema, "tokens");
