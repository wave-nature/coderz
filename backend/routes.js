const router = require("express").Router();
const { activate } = require("./controllers/activate");
const {
  sendOtp,
  verifyOTP,
  refreshTheToken,
  logout,
} = require("./controllers/auth");
const { createRoom, getRooms } = require("./controllers/rooms");
const _protected = require("./middlewares/protected");

router.post("/api/send-otp", sendOtp);
router.post("/api/verify-otp", verifyOTP);
router.post("/api/activate", _protected, activate);
router.get("/api/refresh", refreshTheToken);
router.get("/api/logout", _protected, logout);
router.post("/api/rooms", _protected, createRoom);
router.get("/api/rooms", _protected, getRooms);

module.exports = router;
