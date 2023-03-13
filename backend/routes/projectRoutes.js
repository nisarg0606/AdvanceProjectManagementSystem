const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const auth = require("../middleware/auth");
const { body, validationResult, check } = require("express-validator");

const Project = require("../models/project");
const Faculty = require("../models/faculty");
const Student = require("../models/student");

// @route   GET api/projects
// @desc    Get project of logged in user
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "student" && req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    console.log(req.user.project_id);
    console.log(req.user.isLeader);
    let project = await Project.findById(req.user.project_id);
    // get object of project
    project = project.toObject();
    //get name of leader
    const leader = await Student.findById(project.leader);
    project.leader = leader.name;
    //get name of faculty
    const faculty = await Faculty.findById(project.faculty);
    project.faculty = faculty.name;
    //get name of students
    const students = await Student.find({ _id: { $in: project.students } });
    project.students = students.map((student) => student.name);
    if (req.user.isLeader) {
      res.status(200).json(project);
    } else {
      res.status(200).json({
        title: project.title,
        description: project.description,
        faculty: project.faculty,
        students: project.students,
        status: project.status,
        isApproved: project.isApproved,
        comments: project.comments,
        report_link: project.report_link,
        presentation_link: project.presentation_link,
        repository_link: project.repository_link,
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student" && req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const project = await Project.findById(req.params.id).populate("student");
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(200).json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   POST api/projects
// @desc    Create a project
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("title", "Title is required").not().isEmpty(),
      check("description", "Description is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, description, faculty_id } = req.body;
    if (faculty_id === undefined) {
      faculty_id = null;
    }
    try {
      if (req.user.role !== "student") {
        return res.status(401).json({ msg: "Not authorized" });
      }
      if (req.user.project_id) {
        return res.status(401).json({ msg: "You already have a project" });
      }

      const newProject = new Project({
        title,
        description,
        leader: req.user._id,
        faculty: faculty_id,
        //push user._id to student array
        students: [req.user._id],
        invite_code: generateInviteCode(),
      });
      const project = await newProject.save();

      // Add project to student
      console.log(req.user._id);
      const student = await Student.findById(req.user._id);
      student.project_id = project._id;
      student.isLeader = true;
      await student.save();

      // Add project to faculty
      if (faculty_id) {
        const faculty = await Faculty.findById(faculty_id);
        faculty.projectCount += 1;
        faculty.projects.push(project._id);
        await faculty.save();
      }
      res.status(200).json(project);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// generate invite code
const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 15);
};

// @route   PUT api/projects/:id
// @desc    Update project
// @access  Private
router.put("/:id", auth, async (req, res) => {
  const { title, description, faculty_id } = req.body;
  // Build project object
  const projectFields = {};
  if (title) projectFields.title = title;
  if (description) projectFields.description = description;
  if (faculty_id) projectFields.faculty_id = faculty_id;

  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    if (req.user.project_id !== req.params.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }
    if (req.user.isLeader === false) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
      (err, project) => {
        if (err) {
          return res.status(404).json({ msg: "Project not found" });
        }
        res.status(200).json(project);
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error updating project --> " + err.message);
  }
});

// @route   DELETE api/projects/:id
// @desc    Delete project
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    if (req.user.project_id !== req.params.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }
    if (req.user.isLeader === false) {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    //can only delete project if project is not approved
    if (project.isApproved === true) {
      return res.status(401).json({ msg: "Project is already approved" });
    }
    // Remove project from all students
    for (let i = 0; i < project.students.length; i++) {
      const student = await Student.findById(project.students[i]);
      student.project_id = null;
      student.isLeader = false;
      await student.save();
    }

    // Remove project from faculty
    if (project.faculty) {
      const faculty = await Faculty.findById(project.faculty);
      faculty.projectCount -= 1;
      faculty.projects = faculty.projects.filter(
        (project) => project._id !== req.params.id
      );
      await faculty.save();
    }

    await project.remove();
    res.status(200).json({ msg: "Project removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   POST api/projects/join/
// @desc    Join project
// @access  Private
router.post("/join", auth, async (req, res) => {
  const { invite_code } = req.body;
  try {
    if (req.user.role !== "student" && req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    if (req.user.isLeader === true) {
      return res.status(401).json({ msg: "You are already a leader" });
    }
    if (req.user.project_id) {
      return res.status(401).json({ msg: "You already have a project" });
    }
    const project = await Project.findOne({ invite_code });
    if (!project) {
      return res.status(404).json({ msg: "Invite code is invalid" });
    }
    // Add project to student
    const student = await Student.findById(req.user._id);
    student.project_id = project._id;
    await student.save();
    // Add student to project
    project.students.push(req.user._id);
    //change invite code
    project.invite_code = generateInviteCode();
    // if project has reached max number of students, set invite code to null
    if (project.students.length === project.capacity) {
      project.invite_code = null;
    }
    await project.save();
    res.status(200).json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/projects/leave/
// @desc    Leave project
// @access  Private
router.get("/leave", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    if (req.user.isLeader === true) {
      return res.status(401).json({ msg: "You are a leader" });
    }
    if (!req.user.project_id) {
      return res.status(401).json({ msg: "You are not in a project" });
    }
    const project = await Project.findById(req.user.project_id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    // Remove project from student
    const student = await Student.findById(req.user._id);
    student.project_id = null;
    await student.save();
    // Remove student from project
    project.students = project.students.filter(
      (student) => student._id !== req.user._id
    );
    //change invite code
    project.invite_code = generateInviteCode();
    // if project has reached max number of students, set invite code to null
    if (project.students.length === project.capacity) {
      project.invite_code = null;
    }
    await project.save();
    res.status(200).json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/projects/remove/:id
// @desc    Remove student from project
// @access  Private
router.get("/remove/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "faculty" && req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    if (req.user.isLeader === false) {
      return res.status(401).json({ msg: "You are not a leader" });
    }
    const project = await Project.findById(req.user.project_id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    // Remove project from student
    const student = await Student.findById(req.params.id);
    student.project_id = null;
    await student.save();
    // Remove student from project
    project.students = project.students.filter(
      (student) => student._id !== req.params.id
    );
    //change invite code
    project.invite_code = generateInviteCode();
    // if project has reached max number of students, set invite code to null
    if (project.students.length === project.capacity) {
      project.invite_code = null;
    }
    await project.save();
    res.status(200).json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   POST api/projects/approve/:id
// @desc    Approve project
// @access  Private
router.post("/approve/:id", auth, async (req, res) => {
  try {
    const { comments } = req.body;
    if (req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized from role if" });
    }
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    //can only approve project if project is not approved
    if (project.isApproved === true) {
      return res.status(401).json({ msg: "Project is already approved" });
    }
    //can only approve project if project has user logged in as faculty
    const facultyId = project.faculty.toString();
    const loggedUser = req.user._id.toString();
    if (facultyId !== loggedUser) {
      return res.status(401).json({ msg: "Not authorized from tostring if ?" });
    }
    // return res.status(401).json({ msg: "Not authorized from tostring if" });
    // }
    //can only approve project if project has a title
    if (!project.title) {
      return res.status(401).json({ msg: "Project has no title" });
    }
    //can only approve project if project has a description
    if (!project.description) {
      return res.status(401).json({ msg: "Project has no description" });
    }
    const faculty = await Faculty.findById(project.faculty);

    // Add project to faculty
    faculty.projects.push(project._id);
    faculty.projectCount += 1;
    await faculty.save();
    // Approve project
    project.isApproved = true;
    // if comments are provided, add them to project as comments array
    if (comments) {
      // push comments to project
      project.comments.push({
        text: comments,
        name: req.user.name,
        user: req.user._id,
      });
    }

    await project.save();
    res.status(200).json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   POST api/projects/reject/:id
// @desc    Reject project
// @access  Private
router.post("/reject/:id", auth, async (req, res) => {
  try {
    const { comments } = req.body;
    // if no comments are provided, return error
    if (!comments) {
      return res.status(400).json({ msg: "Comments are required" });
    }
    if (req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    //can only reject project if project is not approved
    if (project.isApproved === true) {
      return res.status(401).json({ msg: "Project is already approved" });
    }
    //can only reject project if project has user logged in as faculty
    const facultyId = project.faculty.toString();
    const loggedUser = req.user._id.toString();
    if (facultyId !== loggedUser) {
      return res.status(401).json({ msg: "Not authorized" });
    }
    //can only reject project if project has a title
    if (!project.title) {
      return res.status(401).json({ msg: "Project has no title" });
    }
    //can only reject project if project has a description
    if (!project.description) {
      return res.status(401).json({ msg: "Project has no description" });
    }
    project.status = "rejected";
    // Reject project
    project.isApproved = false;
    //add comment to project with faculty's name
    project.comments.push({
      text: comments,
      name: req.user.name,
      user: req.user._id,
    });
    await project.save();
    res.status(200).json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   POST api/projects/comment/:id
// @desc    Comment on a project
// @access  Private
router.post("/comment/:id", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ msg: "Text is required" });
    }
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    //can only comment on project if project is approved
    if (project.isApproved === false) {
      return res.status(401).json({ msg: "Project is not approved" });
    }
    //can only comment on project if project has a title
    if (!project.title) {
      return res.status(401).json({ msg: "Project has no title" });
    }
    //can only comment on project if project has a description
    if (!project.description) {
      return res.status(401).json({ msg: "Project has no description" });
    }
    //add comment to project with user's name
    project.comments.push({
      text,
      name: req.user.name,
      user: req.user._id,
    });
    await project.save();
    res.status(200).json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   DELETE api/projects/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    // Pull out comment
    const comment = project.comments.find(
      (comment) => comment.id === req.params.comment_id
    );
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: "Comment does not exist" });
    }
    // Check user
    if (comment.user.toString() !== req.user._id) {
      return res.status(401).json({ msg: "User not authorized" });
    }
    // Get remove index
    const removeIndex = project.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user._id);
    project.comments.splice(removeIndex, 1);
    await project.save();
    res.status(200).json(project);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/projects/:id/comments
// @desc    Get all comments for a project
// @access  Private
router.get("/:id/comments", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(200).json(project.comments);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Project not found" });
    }
    res.status(500).send("Server Error --> " + err.message);
  }
});


// @route   GET api/projects/all
// @desc    Get all projects
// @access  Private
router.get("/all", auth, async (req, res) => {
  try {
    const projects = await Project.find().sort({ date: -1 });
    res.status(200).json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

module.exports = router;
