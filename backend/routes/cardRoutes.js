const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const List = require("../models/list");
const Card = require("../models/card");

// @route   POST api/card/:id
// @desc    Create a card
// @access  Private
router.post("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const { title, description, assignedTo, dueDate } = req.body;
    if (!title) {
      return res.status(400).json({ msg: "title is required" });
    }
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ msg: "List not found" });
    }
    const card = new Card({
      title,
      description,
      list: req.params.id,
      assignedTo,
      dueDate,
    });
    await card.save();

    list.cards.push(card._id);
    await list.save();
    res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   GET api/card using list id
// @desc    Get array of cards of a list
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "student" && req.user.role !== "faculty") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ msg: "List not found" });
    }
    //find card using list id passed in url
    const card = await Card.find({ list: req.params.id });
    if (!card) {
      return res.status(404).json({ msg: "Card not found" });
    }
    res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   Get api/card using card id
// @desc    Get a card
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

// @route   PUT api/card using card id
// @desc    Update a card
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
    const { name, description, assignedTo, dueDate } = req.body;
    if (name) {
      card.name = name;
    }
    if (description) {
      card.description = description;
    }
    if (assignedTo) {
      card.assignedTo = assignedTo;
    }
    if (dueDate) {
      card.dueDate = dueDate;
    }
    await card.save();
    res.status(200).json(card);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

// @route   DELETE api/card using card id
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

// @route  POST api/card/move
// @desc   Move a card from one list to another
// @access Private
router.post("/move", auth, async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(401).json({ msg: "Not authorized" });
    }
    const { cardId, sourceListId, destinationListId } = req.body;
    if (!cardId || !sourceListId || !destinationListId) {
      return res.status(400).json({ msg: "Invalid request" });
    }
    const sourceList = await List.findById(sourceListId);
    if (!sourceList) {
      return res.status(404).json({ msg: "Source list not found" });
    }
    const destinationList = await List.findById(destinationListId);
    if (!destinationList) {
      return res.status(404).json({ msg: "Destination list not found" });
    }
    const card = await Card.findById(cardId);
    if (!card) {
      return res.status(404).json({ msg: "Card not found" });
    }
    // Remove card from source list
    sourceList.cards = sourceList.cards.filter(
      (card) => card.toString() !== cardId
    );
    await sourceList.save();
    // Add card to destination list
    destinationList.cards.push(cardId);
    await destinationList.save();
    res.status(200).json({ msg: "Card moved successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error --> " + err.message);
  }
});

module.exports = router;