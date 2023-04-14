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

// @route Create api/card
// @desc Create a card in a list
// @access Private
router.post("/card", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const project = await Project.findById(req.user.project_id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    const { name, description, list } = req.body;
    const card = new Card({
      name,
      description,
      list,
      board: project.board_id,
    });
    await card.save();
    res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/card using list id
// @desc    Get name of cards of a board where list id is key and card name is value
// @access  Private
router.get("/card", auth, async (req, res) => {
  try {
    if (req.user.role !== "student" && req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const project = await Project.findById(req.user.project_id);
    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }
    const cards = await Card.find({ board: project.board_id });
    if (!cards) {
      return res.status(200).json({ msg: "Cards not found" });
    }
    // get list of cards as value and list id as key
    let cardsList = {};
    cards.forEach((card) => {
      if (cardsList[card.list]) {
        cardsList[card.list].push(card.name);
      } else {
        cardsList[card.list] = [card.name];
      }
    });
    res.status(200).json(cardsList);
    // res.status(200).json(cards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   Update api/card/:id using card id
// @desc    Update card name, description, assignee, due date
// @access  Private
router.put("/card/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ msg: "Card not found" });
    }
    const { name, description, assignee, due_date } = req.body;
    card.name = name;
    card.description = description;
    card.assignedTo = assignee;
    card.dueDate = due_date;
    await card.save();
    res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   Delete api/card/:id using card id
// @desc    Delete a card
// @access  Private
router.delete("/card/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ msg: "Card not found" });
    }
    await card.remove();
    res.status(200).json({ msg: "Card deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/card/:id using card id
// @desc    Get card details
// @access  Private
router.get("/card/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student" && req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ msg: "Card not found" });
    }
    res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route UPDATE api/card/:id/list using card id
// @desc Update list of a card
// @access Private
router.put("/card/:id/list", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ msg: "Card not found" });
    }
    const { list } = req.body;
    card.list = list;
    await card.save();
    res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

module.exports = router;
