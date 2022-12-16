const crypto = require("crypto");
const { hashOtp } = require("./hash");
const smsToken = process.env.TWILIO_SECRET;
const smsSid = process.env.TWILIO_SID;
const client = require("twilio")(smsSid, smsToken, {
  lazyLoading: true,
});

module.exports = {
  generateOtp() {
    const otp = crypto.randomInt(1000, 9999);
    return otp;
  },

  async sendBySms(phone, otp) {
    return await client.messages.create({
      to: phone,
      from: process.env.SMS_FROM,
      body: `Your codersvilla OTP is ${otp}`,
    });
  },
  verifyOtp(hashedOtp, data) {
    // new hash
    const computedHash = hashOtp(data);
    return computedHash === hashedOtp;
  },
};
