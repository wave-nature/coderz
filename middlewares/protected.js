const { verifyAccessToken } = require("../services/token");

module.exports = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies;
    if (!accessToken) throw new Error("No Access Token");

    const payload = verifyAccessToken(accessToken);
    if (!payload) throw new Error("Your token is invalid");

    req.user = payload;
    next();
  } catch (error) {
    console.log(error.message);
    res.status(401).json({ message: error.message });
  }
};
