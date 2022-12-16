const Room = require("../models/rooms");
const AppError = require("../utils/AppError");
const catchError = require("../utils/catchError");

module.exports = {
  createRoom: catchError(async (req, res, next) => {
    const { topic, type } = req.body;
    if (!topic || !type)
      return next(new AppError("Please provide topic or type", 400));

    const room = await Room.create({
      type,
      topic,
      ownerId: req.user.id,
      speakers: [req.user.id],
    });

    res.status(201).json({
      room,
    });
  }),

  getRooms: catchError(async (req, res, next) => {
    // open,social,private
    const filter = ["open"];
    const rooms = await Room.find({ type: { $in: filter } })
      .populate("ownerId")
      .populate("speakers")
      .exec();

    res.status(200).json({
      rooms,
    });
  }),

  getRoom: catchError(async (req, res, next) => {
    const room = await Room.findById(req.params.id);

    res.status(200).json({
      room,
    });
  }),
};
