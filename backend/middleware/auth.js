const jwt = require("jsonwebtoken");
const Student = require("../models/student");
const Faculty = require("../models/faculty");
const Admin = require("../models/admin");

const models = {
  student: Student,
  faculty: Faculty,
  admin: Admin,
};

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await models[decoded.role].findOne({ _id: decoded._id });
    if (!user) {
      console.log("User not found");
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
