const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");

const Student = require("../models/student");
const Faculty = require("../models/faculty");
const Project = require("../models/project");
const Board = require("../models/board");
const List = require("../models/list");
const Card = require("../models/card");

// @route Create api/list
// @desc Create a list
// @access Private
router.post("/list", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const project = await Project.findById(req.user.project_id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    const { name } = req.body;
    const list = new List({
      name,
      board: project.board_id,
    });
    await list.save();
    res.status(200).json(list);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/list using board id
// @desc    Get lists of a board
// @access  Private
router.get("/list", auth, async (req, res) => {
  try {
    if (req.user.role !== "student" && req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const project = await Project.findById(req.user.project_id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    const lists = await List.find({ board: project.board_id });
    if (!lists) {
      return res.status(200).json({ msg: "Lists not found" });
    }
    res.status(200).json(lists);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route UPDATE api/list/:id
// @desc Update name of list of a board
// @access Private
router.put("/list/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ msg: "List not found" });
    }
    const { name } = req.body;
    list.name = name;
    await list.save();
    res.status(200).json(list);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route DELETE api/list/:id
// @desc Delete a list
// @access Private
router.delete("/list/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ msg: "List not found" });
    }
    await list.remove();
    res.status(200).json({ msg: "List deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

module.exports = router;