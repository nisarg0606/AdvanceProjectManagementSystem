const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Student = require("../models/student");
const Faculty = require("../models/faculty");
const Admin = require("../models/admin");
const BlacklistedToken = require("../models/blacklistedToken");
const Project = require("../models/project");
const auth = require("../middleware/auth");

const router = express.Router();

const models = {
  student: Student,
  faculty: Faculty,
  admin: Admin,
};
//@route POST api/users/login
//@desc Login user
//@access Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).send({ error: "Please enter all fields" });

    let user,
      message = null;

    user = await Student.findOne({ email });
    if (user) {
      if (user.password == password) {
        return res.status(200).send({
          message:
            "Please change your password by calling /api/users/change-password",
        });
      }
      // console.log(user);
      //   console.log("student found");
    } else {
      user = await Faculty.findOne({ email });
      if (user) {
        if (user.password == password) {
          return res.status(200).send({
            userId: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            message:
              "Please change your password by calling /api/users/change-password",
          });
        }
        // console.log("faculty found");
        console.log(user);
      } else {
        user = await Admin.findOne({ email });
        if (user) {
          //   console.log("admin found");
          // console.log(user);
        }
      }
    }

    if (!user) return res.status(401).send({ error: "you are not registered" });
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(401).send({ error: "Invalid password" });

    // add token to user data

    // remove password from user data
    delete user.password;
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET
    );
    // console.log(token);
    user = user.toObject();
    user.token = token;
    //remove password from user data
    delete user.password;
    //set token in header
    // if student then show project id also
    if (user.role == "student") {
      const project = await Project.findOne(user.project_id);
      user.projectId = project._id;
      if (project.isApproved || project.status == "rejected") {
        user.rejected = true;
        const comments = project.comments;
        const latestComment = comments[comments.length - 1];
        user.comment = latestComment.text;
      }else{
        user.rejected = false;
      }
    }
    res.header("x-auth-token", token);
    res.status(200).json(user);
  } catch (e) {
    res.status(400).send("Error in Logging in" + e.message);
  }
});

//@route POST api/users/signup (only for admin)
//@desc Register admin
//@access Public
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    //check if user already exists
    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).send({ error: "User already exists" });
    }

    // encrypt password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create new user
    const user = new Admin({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).send({ user });
  } catch (e) {
    console.log(e);
  }
});

//@route POST api/users/change-password
//@desc Change password
//@access Public
router.post("/change-password", async (req, res) => {
  try {
    const { email, password, newPassword } = req.body;
    let user;
    user = await Student.findOne({ email });
    if (user) {
      if (user.password == password) {
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        user.passwordChanged = true;
        await user.save();
        return res
          .status(200)
          .send({ message: "Password changed successfully" });
      } else {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(401).send({ error: "Invalid password" });
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        user.passwordChanged = true;
        await user.save();
        return res
          .status(200)
          .send({ message: "Password changed successfully" });
      }
    } else {
      user = await Faculty.findOne({ email });
      if (user) {
        if (user.password == password) {
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          user.password = hashedPassword;
          user.passwordChanged = true;
          await user.save();
          return res
            .status(200)
            .send({ message: "Password changed successfully" });
        } else {
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch)
            return res.status(401).send({ error: "Invalid password}" });
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          user.password = hashedPassword;
          user.passwordChanged = true;
          await user.save();
          return res
            .status(200)
            .send({ message: "Password changed successfully" });
        }
      } else {
        user = await Admin.findOne({ email });
        if (!user)
          return res.status(401).send({ error: "you are not registered" });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
          return res.status(401).send({ error: "Invalid password}" });
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        await user.save();
        res.status(200).send({ message: "Password changed successfully" });
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400).send("Error in Changing Password " + e.message);
  }
});

//route GET api/users/logout
//desc logout user
//access Private
router.get("/logout", auth, async (req, res) => {
  res.token = null;
  //add token to blacklist
  const blacklistedToken = new BlacklistedToken({
    token: req.token,
    expires: req.tokenExpires,
  });
  await blacklistedToken.save();
  //check other tokens in blacklist and remove expired ones
  const blacklistedTokens = await BlacklistedToken.find();
  blacklistedTokens.forEach(async (token) => {
    if (token.expires < Date.now()) {
      await BlacklistedToken.findByIdAndDelete(token._id);
    }
  });
  res.status(200).send({ message: "Logged out successfully" });
});

//route GET api/users/all_users
//desc get all users
//access Public
router.get("/all_users", async (req, res) => {
  try {
    const students = await Student.find();
    const faculties = await Faculty.find();
    const admins = await Admin.find();
    const data = {
      students,
      faculties,
      admins,
    };
    res.status(200).send(data);
  } catch (e) {
    res.status(400).send("Error in getting users" + e.message);
  }
});

//route GET api/users/all_projects
//desc get all projects
//access Public
router.get("/all_projects", async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).send(projects);
  } catch (e) {
    res.status(400).send("Error in getting projects" + e.message);
  }
});

module.exports = router;
