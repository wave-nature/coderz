const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, "phone is required"],
    },
    name: {
      type: String,
    },
    avatar: {
      type: String,
      get: (data) => {
        const fullUrl = `${process.env.PATH_URL}${data}`;
        return fullUrl;
      },
    },
    activated: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model("User", userSchema);
