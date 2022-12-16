const jwt = require("jsonwebtoken");
const Refresh = require("../models/refresh");

module.exports = {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
      expiresIn: "1m",
    });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: "1y",
    });

    return { accessToken, refreshToken };
  },

  async storeRefreshToken(token, user) {
    try {
      await Refresh.create({ token, user });
    } catch (error) {
      console.log(error);
    }
  },

  verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  },
  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  },
};
