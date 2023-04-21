const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Student = require("../models/student");
const Faculty = require("../models/faculty");
const Project = require("../models/project");
const auth = require("../middleware/auth");
const { count } = require("../models/student");
const mongo = require("mongodb");

const router = express.Router();
// @route   GET api/student/dashboard
// @desc    Get Faculty name, email,phone number, Group members, Group Leader and project title
// @access  Private
router.get("/dashboard", auth, async (req, res) => {
  try {
    if (req.user.project_id === null) {
      return res.status(404).json({ msg: "You do not have any projects" });
    }
    const project = await Project.findOne({ _id: req.user.project_id });
    let leaderId = project.leader;
    if (!project) {
      return res.status(404).json({ msg: "Projects not found" });
    }
    if (project.status === "rejected" && project.isApproved === false) {
      const comments = project.comments;
      const message =
        "Please delete this project by clicking the delete button here and create a new one";
      return res.status(200).json({ msg: message, comment: comments, rejected: true, projectId: project._id });
    }
    // get leader name and email
    const leader = await Student.findOne({ _id: leaderId }).select(
      "name email"
    );
    const leaderName = leader.name;
    const leaderEmail = leader.email;
    const groupMembers = [];
    for (let i = 0; i < project.students.length; i++) {
      const member = await Student.findById(project.students[i]);
      groupMembers.push(member.name);
    }
    const totalMembers = groupMembers.length;
    const projectId = project._id;
    // get project title
    const projectTitle = project.title;
    const projectDescription = project.description;
    const project_type = project.project_type;
    const project_company = project.company;
    const project_status = project.status;
    const project_comments = project.comments;
    const project_isApproved = project.isApproved;
    const invite_code = project.invite_code;
    // get faculty name, email and phone number
    const faculty = await Faculty.findById(project.faculty);
    const facultyName = faculty.name;
    const facultyEmail = faculty.email;
    const facultyPhone = faculty.phoneNumber;
    res.status(200).json({
      projectId,
      projectTitle,
      projectDescription,
      project_type,
      project_status,
      project_comments,
      project_isApproved,
      project_company,
      invite_code,
      facultyName,
      facultyEmail,
      facultyPhone,
      leaderName,
      leaderEmail,
      groupMembers,
      totalMembers,
      rejected: false,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/student/profile
// @desc    Get student profile
// @access  Private
router.get("/profile", auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id).select("-password");
    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }
    res.status(200).json(student);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/student/group
// @desc    Get student group
// @access  Private
router.get("/group", auth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.user.project_id });
    if (!project) {
      return res
        .status(404)
        .json({ msg: "Group not found as you do not have any projects" });
    }
    const leaderEmail = await Student.findById(project.leader).select("email");
    const groupMembers = [];
    for (let i = 0; i < project.students.length; i++) {
      const member = await Student.findById(project.students[i]);
      // take member+loopvalue as key and name, email, enrollment number as value
      groupMembers.push({
        ["member" + (i + 1)]: {
          _id: member._id,
          name: member.name,
          email: member.email,
          enrollment_number: member.enrollment_number,
          leaderEmail: leaderEmail.email,
        },
      });
    }
    res.status(200).json(groupMembers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/student/projectid
// @desc    Get project id of logged in student
// @access  Private
router.get("/projectid", auth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.user.project_id });
    if (!project) {
      return res
        .status(404)
        .json({ msg: "Group not found as you do not have any projects" });
    }
    const projectId = project._id;
    res.status(200).json(projectId);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});
module.exports = router;
