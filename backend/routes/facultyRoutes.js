const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Student = require("../models/student");
const Faculty = require("../models/faculty");
const Admin = require("../models/admin");
const Project = require("../models/project");
const auth = require("../middleware/auth");
const { count } = require("../models/student");

const router = express.Router();

const models = {
  student: Student,
  faculty: Faculty,
  admin: Admin,
};

//@route GET api/faculty/available
//@desc Get all available faculty
//@access Private
router.get("/available", auth, async (req, res) => {
  try {
    // Get all faculty with less than maxProjects and also get remaining project slots
    const faculties = await Faculty.find({
      $expr: { $lt: ["$projectCount", "$maxProjects"] },
    }).select("name projectCount maxProjects");
    const facultyNames = faculties.map((faculty) => {
      return {
        name: faculty.name,
        remainingProjects: faculty.maxProjects - faculty.projectCount,
      };
    });
    res.status(200).json(facultyNames);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route GET api/faculty/profile
//@desc Get faculty profile
//@access Private
router.get("/profile", auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user._id).select("-password");
    res.status(200).json(faculty);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route PUT api/faculty/profile
//@desc Update faculty profile
//@access Private
router.put("/profile", auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user._id).select("-password");
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }
    if (req.body.name) faculty.name = req.body.name;
    if (req.body.email) faculty.email = req.body.email;
    if (req.body.designation) faculty.designation = req.body.designation;
    if (req.body.department) faculty.department = req.body.department;
    if (req.body.maxProjects) faculty.maxProjects = req.body.maxProjects;
    if (req.body.phoneNumber) faculty.phoneNumber = req.body.phoneNumber;

    await faculty.save();
    res.status(200).json(faculty);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error updating profile: " + err.message);
  }
});

//@route GET api/faculty/requests
//@desc Get all project requests
//@access Private
router.get("/requests", auth, async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.user._id).select("-password");
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }
    const requests = [];
    // get faculty id from each project where faculy id is = req.user._id and the isApproved is false
    const projects = await Project.find({
      faculty: req.user._id,
      isApproved: false,
    });
    for (let i = 0; i < projects.length; i++) {
      // get project title
      const title = projects[0].title;
      // get project description
      const description = projects[i].description;
      // get leader name
      const leaderName = await Student.findById(projects[i].leader).select(
        "name"
      );
      // get leader email
      const leaderEmail = await Student.findById(projects[i].leader).select(
        "email"
      );
      // get student array
      const students = projects[i].students;
      // get student names
      const studentNames = [];
      for (let j = 0; j < students.length; j++) {
        const studentName = await Student.findById(students[j]).select("name");
        studentNames.push(studentName.name);
      }
      //add all to requests array
      requests.push({
        project: title,
        description: description,
        leaderName: leaderName.name,
        leaderEmail: leaderEmail.email,
        students: studentNames,
      });
    }
    res.status(200).json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

//@route GET api/faculty/dashboard
//@desc Get faculty dashboard
//@access Private
router.get("/dashboard", auth, async (req, res) => {
  //dashboard contains total accepted projects, total requests, total students
  try {
    const faculty = await Faculty.findById(req.user._id).select("-password");
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }
    const dashboard = {};
    // get total accepted projects
    const acceptedProjects = await Project.find({
      faculty: req.user._id,
      isApproved: true,
    });
    dashboard.totalAcceptedProjects = acceptedProjects.length;
    // get total requests
    const requests = await Project.find({
      faculty: req.user._id,
      isApproved: false,
    });
    dashboard.totalRequests = requests.length;
    // get total students from accepted projects
    let totalStudents = 0;
    for (let i = 0; i < acceptedProjects.length; i++) {
      totalStudents += acceptedProjects[i].students.length;
    }
    dashboard.totalStudents = totalStudents;
    res.status(200).json(dashboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});
module.exports = router;
