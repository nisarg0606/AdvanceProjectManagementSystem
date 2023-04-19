const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Board = require("../models/board");
const Project = require("../models/project");

// @route   POST api/board
// @desc    Create a board
// @access  Private
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const { name, description } = req.body;
    const board = new Board({
      name,
      description,
      project: req.user.project_id,
    });
    await board.save();
    // const project = await Project.findById(req.user.project_id);
    // if (!project) {
    //   return res.status(404).json({ msg: "Project not found" });
    // }
    // project.board_id = board._id;
    // await project.save();
    res.status(200).json(board);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/board using project id
// @desc    Get board of a project
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student" && req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const project = await Project.findById(req.user.project_id)
      .populate("faculty", "leader")
      .exec();
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    //find board using project id passed in url
    const board = await Board.findOne({ project: req.params.id });
    if (!board) {
      return res.status(404).json({ msg: "Board not found" });
    }
    res.status(200).json(board);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   UPDATE api/board/:id
// @desc    Update name and description of a board using board id
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const { name, description } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ msg: "Board not found" });
    }
    board.name = name;
    board.description = description;
    await board.save();
    res.status(200).json(board);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

module.exports = router;
