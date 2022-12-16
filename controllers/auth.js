const { generateOtp, sendBySms, verifyOtp } = require("../services/otp");
const { hashOtp } = require("../services/hash");
const { findUser, createUser } = require("../services/user");
const {
  generateTokens,
  storeRefreshToken,
  verifyRefreshToken,
} = require("../services/token");
const UserDto = require("../dtos/user");
const catchError = require("../utils/catchError");
const AppError = require("../utils/AppError");
const Refresh = require("../models/refresh");

const setTokensInCookies = (res, refreshToken, accessToken) => {
  res.cookie("refreshToken", refreshToken, {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    // secure: false,
    httpOnly: true,
  });
  res.cookie("accessToken", accessToken, {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    // secure: false,
    httpOnly: true,
  });
};

module.exports = {
  sendOtp: async (req, res) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({
        message: "phone number is required",
      });
    }

    const otp = generateOtp();
    const ttl = 1000 * 60 * 10; // 10 min
    const expires = Date.now() + ttl;
    const data = `${phone}.${otp}.${expires}`;
    const hash = hashOtp(data);

    //send otp
    // try {
    //   await sendBySms(phone, otp);
    //   res.status(200).json({
    //     hash: `${hash}.${expires}`,
    //     phone,
    //   });
    // } catch (err) {
    //   console.log("otp error");
    //   console.log(err);
    //   res.status(500).json({
    //     message: "message sending failed",
    //   });
    // }

    res.status(200).json({
      hash: `${hash}.${expires}`,
      phone,
      otp,
    });
  },

  verifyOTP: async (req, res) => {
    const { otp, hash, phone } = req.body;

    if (!otp || !hash || !phone) {
      return res.status(400).json({ message: "All fields are reqired" });
    }

    const [hashedOtp, expires] = hash.split(".");

    if (Date.now() > +expires) {
      return res.status(400).json({ message: "OTP expired!" });
    }

    const data = `${phone}.${otp}.${expires}`;

    const isValid = verifyOtp(hashedOtp, data);
    if (!isValid) {
      return res.status(400).json({
        message: "OTP is invalid",
      });
    }

    // create user
    let user;

    try {
      user = await findUser({ phone });
      if (!user) {
        user = await createUser({ phone });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "DB error",
      });
    }

    // modified user
    user = new UserDto(user);

    // token
    // refresh token (headers or cookies) has more length than access token(localstorage)
    const { accessToken, refreshToken } = generateTokens({
      id: user._id,
      activated: false,
    });

    await storeRefreshToken(refreshToken, user._id);

    setTokensInCookies(res, refreshToken, accessToken);

    res.status(200).json({
      user,
    });
  },

  refreshTheToken: catchError(async (req, res, next) => {
    // get token
    const { refreshToken: token } = req.cookies;

    // verify token
    const payload = verifyRefreshToken(token);
    if (!payload) next(new AppError("Invalid Token", 401));

    // check token in db
    const refreshTokenInDB = await Refresh.findOne({ user: payload.id, token });
    if (!refreshTokenInDB) next(new AppError("No such token found", 404));

    // verify user
    const user = await findUser({ _id: payload.id });
    if (!user) next(new AppError("No such user found", 404));

    const { refreshToken, accessToken } = generateTokens({ id: user._id });

    // update refrsh token
    await Refresh.findOneAndUpdate(
      refreshTokenInDB._id,
      { token: refreshToken },
      { new: true }
    );

    // set token in cookies
    setTokensInCookies(res, refreshToken, accessToken);

    res.status(203).json({ user: new UserDto(user), auth: true });
  }),

  async logout(req, res) {
    const { refreshToken } = req.cookies;
    // clear refresh token from db
    await Refresh.deleteOne({ token: refreshToken });

    res.cookie("refreshToken", null);
    res.cookie("accessToken", null);

    res.status(200).json({
      auth: false,
      user: null,
    });
  },
};
