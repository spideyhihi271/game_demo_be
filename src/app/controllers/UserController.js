const { User, validate } = require("../models/User");
const excelJs = require("exceljs");

class UserController {
  async register(req, res) {
    const data = req.body;
    // Check email & phone
    const isEmailExist = await User.findOne({ email: data.email });
    const isPhoneExist = await User.findOne({ phone: data.phone });
    if (isEmailExist || isPhoneExist)
      return res.status(403).send({
        message: "Email or Phone was used",
      });
    // Validate
    const { error } = validate(data);
    if (error)
      return res.status(400).send({ message: error.details[0].message });
    // Saving
    data.isValidAccount = true;
    const newUser = await new User(data).save();
    return res.status(200).send({
      message: "Create successfull",
      data: newUser.toObject(),
    });
  }
  async addHistoryByEmail(req, res) {
    const email = req.params.email;
    const data = req.body;
    const user = await User.findOne({ email: email });
    if (!user)
      return res.status(404).send({
        message: "Not found your account",
      });
    // Save
    if (user.history.length > 3)
      return res.status(403).send({
        message: "The number of turns has been exceeded",
      });
    // Saving
    let newData = user.toObject();
    // Update score
    const newPoints =
      newData.highestScore < data.coins ? data.coins : newData.highestScore;
    // Update histoty
    const history = newData.history;
    const newTurn = {
      major: data.major,
      bee: data.bee,
      win: data.win,
      hp: data.hp,
      defaultHp: data.defaultHp,
      barriesDefault: data.barriesDefault,
      coins: data.coins,
    };
    history.push(newTurn);
    newData = { ...newData, highestScore: newPoints, history };
    // Saving
    const response = await User.findByIdAndUpdate(newData._id, newData);
    return res
      .status(200)
      .send({ message: "Your turn was saved", data: newData });
  }
  async getRanking(req, res) {
    try {
      const data = await User.find()
        .sort({ highestScore: -1 })
        .limit(100)
        .exec();
      return res.status(200).send({
        message: "Ranking",
        data,
      });
    } catch (error) {
      throw new Error(error);
    }
  }
  async exportFileXlsx(req, res) {
    try {
      const users = await User.find({ role: 0, isValidAccount: true }).exec();
      const workbook = new excelJs.Workbook();
      const sheet = workbook.addWorksheet("data");
      sheet.columns = [
        { header: "Số thứ tự", key: "idx", width: 25 },
        { header: "Họ và tên", key: "name", width: 25 },
        { header: "Số điện thoại", key: "phone", width: 25 },
        { header: "Email", key: "email", width: 25 },
        { header: "Địa chỉ", key: "address", width: 25 },
        { header: "Tên trường THPT", key: "school", width: 25 },
        { header: "Điểm số", key: "score", width: 25 },
      ];
      users.map((user, idx) => {
        sheet.addRow({
          idx: idx + 1,
          name: user.name,
          phone: user.phone,
          email: user.email,
          address: user.address,
          school: user.school,
          score: user.highestScore,
        });
      });
      // Thiết lập các header cho phản hồi HTTP
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "data.xlsx");
      workbook.xlsx.write(res);
    } catch (error) {
      throw new Error(error);
    }
  }
}

module.exports = new UserController();