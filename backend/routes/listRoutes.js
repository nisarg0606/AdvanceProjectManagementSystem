const express = require("express");
const router = express.Router();

const Student = require("../models/student");
const Faculty = require("../models/faculty");
const Project = require("../models/project");
const Board = require("../models/board");
const List = require("../models/list");
const Card = require("../models/card");

const auth = require("../middleware/auth");

// @route   POST  api/list
// @desc    Create a list
// @access  Private
router.post("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const { name } = req.body;
    const board = await Board.findById(board_id);
    if (!board) {
      return res.status(404).json({ msg: "Board not found" });
    }
    const list = new List({
      name,
      board: req.params.id,
    });
    await list.save();

    board.lists.push(list._id);
    await board.save();
    res.status(200).json(list);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/list using board id
// @desc    Get array of lists of a board
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student" && req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ msg: "Board not found" });
    }
    //find list using board id passed in url
    const list = await List.find({ board: req.params.id });
    if (!list) {
      return res.status(404).json({ msg: "List not found" });
    }
    res.status(200).json(list);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   UPDATE api/list/:id
// @desc    Update a list
// @access  Private
router.put("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const { name } = req.body;
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ msg: "List not found" });
    }
    list.name = name;
    await list.save();
    res.status(200).json(list);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   DELETE api/list/:id
// @desc    Delete a list
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ msg: "List not found" });
    }
    const board = await Board.findById(list.board);
    if (!board) {
      return res.status(404).json({ msg: "Board not found" });
    }
    const index = board.lists.indexOf(req.params.id);
    board.lists.splice(index, 1);
    await board.save();
    await list.remove();
    res.status(200).json({ msg: "List deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});
