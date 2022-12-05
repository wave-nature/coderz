const crypto = require("crypto");
module.exports = {
  hashOtp(data) {
    return crypto
      .createHmac("sha256", process.env.HASH_SECRET)
      .update(data)
      .digest("hex");
  },
};
