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
// @route   GET api/students/dashboard
// @desc    Get Faculty name, email,phone number, Group members, Group Leader and project title
// @access  Private
router.get("/dashboard", auth, async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.user.project_id });
    let leaderId = project.leader;
    if (!project) {
      return res.status(404).json({ msg: "Projects not found" });
    }
    if(project.status === "rejected" && project.isApproved === false){
        const comments = project.comments;
        const message = "Please delete this project by clicking the delete button here and create a new one";
        return res.status(205).json({message,comments});
    }
    // get leader name and email
    const leader = await Student.findOne({ _id: leaderId }).select( "name email");
    const leaderName = leader.name;
    const leaderEmail = leader.email;
    const groupMembers = [];
    for (let i = 0; i < project.students.length; i++) {
      const member = await Student.findById(project.students[i]);
      groupMembers.push(member.name);
    }
    const totalMembers = groupMembers.length;
    // get project title
    const projectTitle = project.title;
    const projectDescription = project.description;
    const project_type = project.project_type;
    const project_company = project.company;
    const project_status = project.status;
    const project_comments = project.comments;
    const project_isApproved = project.isApproved;
    // get faculty name, email and phone number
    const faculty = await Faculty.findById(project.faculty);
    const facultyName = faculty.name;
    const facultyEmail = faculty.email;
    const facultyPhone = faculty.phoneNumber;
    res.status(200).json({
      projectTitle,
      projectDescription,
      project_type,
      project_status,
      project_comments,
      project_isApproved,
      project_company,
      facultyName,
      facultyEmail,
      facultyPhone,
      leaderName,
      leaderEmail,
      groupMembers,
      totalMembers,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});


module.exports = router;