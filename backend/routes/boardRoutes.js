const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Board = require("../models/board");
const Project = require("../models/project");
const List = require("../models/list");

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
    // const project = await Project.findById(req.user.project_id);
    // if (!project) {
    //   return res.status(404).json({ msg: "Project not found" });
    // }
    // project.board_id = board._id;
    // await project.save();
    //create predfined lists
    const list1 = new List({
      name: "To Do",
      board: board._id,
    });
    const list2 = new List({
      name: "In Progress",
      board: board._id,
    });
    const list3 = new List({
      name: "In Review",
      board: board._id,
    });
    const list4 = new List({
      name: "Done",
      board: board._id,
    });
    await list1.save();
    await list2.save();
    await list3.save();
    await list4.save();
    board.lists.push(list1._id);
    board.lists.push(list2._id);
    board.lists.push(list3._id);
    board.lists.push(list4._id);
    await board.save();

    res.status(200).json(board);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/board using project id
// @desc    Get board of a project
// @access  Private
router.get("/", auth, async (req, res) => {
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
    //find board using project id and populate it with array of lists and cards
    const board = await Board.findOne({ project: project._id })
      .populate({
        path: "lists",
        select: "name cards",
        model: "List",
        populate: {
          path: "cards",
          model: "Card",
        },
      })
      .exec();
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
