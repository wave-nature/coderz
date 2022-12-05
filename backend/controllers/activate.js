const Jimp = require("jimp");
const path = require("path");
const { findUser } = require("../services/user");
const UserDto = require("../dtos/user");

module.exports = {
  async activate(req, res) {
    const { name, avatar } = req.body;
    if (!name || !avatar)
      return res.status(400).json({ message: "All fields are requried" });

    // Image Base64

    const buffer = Buffer.from(
      // avatar.replace(/^data:image\/png;base64,/, ""),
      avatar.split(",")[1],
      "base64"
    );

    const imagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.png`;

    try {
      const jimpRes = await Jimp.read(buffer);

      jimpRes
        .resize(150, Jimp.AUTO)
        .write(path.resolve(__dirname, `../storage/${imagePath}`));
    } catch (error) {
      return res.status(500).json({ message: "Could not process image" });
    }

    const userId = req.user.id;

    try {
      const user = await findUser({ _id: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found!" });
      }

      user.activated = true;
      user.name = name;
      user.avatar = `/storage/${imagePath}`;
      await user.save();

      res.status(200).json({
        user: new UserDto(user),
        auth: true,
      });
    } catch (error) {
      return res.status(500).json({ message: "something went wrong" });
    }
  },
};
