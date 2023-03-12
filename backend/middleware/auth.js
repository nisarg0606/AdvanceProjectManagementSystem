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
    if (!token) {
      console.log("No token found");
      throw new Error();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await models[decoded.role].findOne({ _id: decoded.userId });
    if (!user) {
      console.log("User not found");
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate. ---> " + e.message });
  }
};

module.exports = auth;
