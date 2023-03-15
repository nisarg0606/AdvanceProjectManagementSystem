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
    // set faculty id as key and name, remainingProjects as value
    const facultyNames = {};
    faculties.forEach((faculty) => {
      facultyNames[faculty._id] = {
        name: faculty.name,
        remainingProjects: faculty.maxProjects - faculty.projectCount,
      };
    });
    // const facultyNames = faculties.map((faculty) => {
    //   return {
    //     _id: faculty._id,
    //     name: faculty.name,
    //     remainingProjects: faculty.maxProjects - faculty.projectCount,
    //   };
    // });
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
      status: "active"
    });
    for (let i = 0; i < projects.length; i++) {
      //get project id
      const projectId = projects[i]._id;
      // get project title
      const title = projects[i].title;
      // get project description
      const description = projects[i].description;
      // get leader name
      const leaderName = await Student.findById(projects[i].leader).select(
        "name email"
      );
      // get leader email
      const leaderEmail = leaderName.email;
      // get student array
      const students = projects[i].students;
      // get student names
      const studentsData = [];
      //project type
      const projectType = projects[i].project_type;
      //frontendtechnologies
      const frontendTechnologies = projects[i].frontendTechnologies;
      //backendtechnologies
      const backendTechnologies = projects[i].backendTechnologies;
      //database
      const database = projects[i].database;
      //invite-code
      const inviteCode = projects[i].invite_code;
      for (let j = 0; j < students.length; j++) {
        const student = await Student.findById(students[j]).select("name _id");
        // create json when id is key and name is value
        studentsData.push({ id: student._id, name: student.name });
        // studentsData.push(student._id);
      }
      //add all to requests array
      requests.push({
        projectId: projectId,
        project: title,
        description: description,
        leaderName: leaderName.name,
        leaderEmail: leaderEmail,
        //return id and name of each student
        students: studentsData,
        projectType: projectType,
        frontendTechnologies: frontendTechnologies,
        backendTechnologies: backendTechnologies,
        database: database,
        inviteCode: inviteCode,
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
      status: "active",
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

//get group names under a faculty
//@route GET api/faculty/groups
//@desc Get Students groups under a faculty
//@access Private
router.get("/groups", auth, async (req, res) => {
  try {
    // if role is not faculty then return error
    if (req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const faculty = await Faculty.findById(req.user._id).select("-password");
    if (!faculty) {
      return res.status(404).json({ msg: "Faculty not found" });
    }
    let groups = await Project.find({
      faculty: req.user._id,
      isApproved: true,
    });
    const groupsData = [];
    for (let i = 0; i < groups.length; i++) {
      let group = groups[i].toObject();
      //replace spaces in groupname with _
      group.groupName = group.groupName.replace(/\s/g, "_");
      const leader = await Student.findById(group.leader).select("name email");
      group.leader = { id: leader._id, name: leader.name, email: leader.email };
      const students = [];
      for (let j = 0; j < group.students.length; j++) {
        const student = await Student.findById(group.students[j]).select(
          "name email"
        );
        students.push({ id: student._id, name: student.name, email: student.email });
      }
      //use students id as key and name as value
      const studentsjson = {};
      for (let i = 0; i < students.length; i++) {
        studentsjson[students[i].id] = students[i];
      }
      group.students = studentsjson;
      groupsData.push(group);
    }
    //take group name as key and group data as array
    const groupsjson = {};
    for (let i = 0; i < groupsData.length; i++) {
      //set group name as key and group data as array
      groupsjson["Group" + (i+1)] = groupsData[i];
    }
    res.status(200).json(groupsjson);

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
