const jwt = require("jsonwebtoken");
const Student = require("../models/student");
const Faculty = require("../models/faculty");
const Admin = require("../models/admin");
const BlacklistedToken = require("../models/blacklistedToken");

const models = {
  student: Student,
  faculty: Faculty,
  admin: Admin,
  blacklistedToken: BlacklistedToken,
};

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("No token found");
      throw new Error();
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //if token expired
    if (decoded.exp < Date.now() / 1000) {
      console.log("Token expired");
      throw new Error();
    }
    const user = await models[decoded.role].findOne({ _id: decoded.userId });
    if (!user) {
      console.log("User not found");
      throw new Error();
    }

    const blacklistedToken = await models.blacklistedToken.findOne({
      token: token,
    });
    if (blacklistedToken) {
      console.log("Token blacklisted");
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
