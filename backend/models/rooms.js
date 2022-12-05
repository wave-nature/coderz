const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    topic: {
      type: String,
      required: [true, "Please provide topic"],
    },
    type: {
      type: String,
      required: [true, "Please provide topic"],
    },
    ownerId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    speakers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

const Room = mongoose.model("Room", roomSchema, "rooms");

module.exports = Room;
