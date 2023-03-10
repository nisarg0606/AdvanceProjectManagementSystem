const express = require("express");
const jwt = require("jsonwebtoken");
const Student = require("../models/student");
const Faculty = require("../models/faculty");
const Admin = require("../models/admin");

const router = express.Router();

const models = {
  student: Student,
  faculty: Faculty,
  admin: Admin,
};

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    let user, role;

    user = await Student.findOne({ email });
    if (user) {
      role = "student";
    } else {
      user = await Faculty.findOne({ email });
      if (user) {
        role = "faculty";
      } else {
        user = await Admin.findOne({ email });
        if (user) {
          role = "admin";
        }
      }
    }

    if (!user) {
      return res.status(401).send({ error: "Invalid login credentials" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).send({ error: "Invalid login credentials" });
    }

    const token = jwt.sign(
      { _id: user._id, role: role },
      process.env.JWT_SECRET
    );
    res.send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
});

//signup route only for admin
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = new Admin({ email, password });
    await user.save();
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.status(201).send({ user, token });
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
