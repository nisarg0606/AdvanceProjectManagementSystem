const mongoose = require("mongoose");
// const Board = require("./board");
// const List = require("./list");

const CommentSchema = new mongoose.Schema({
  text: {
    type: String,
    // required: true,
  },
  name: {
    type: String,
    // required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "onModel",
    // required: true,
  },
  email: {
    type: String,
    // required: true,
  },
  onModel: {
    type: String,
    enum: ["Faculty", "Student"],
    // required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
const CardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "List",
    required: true,
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  dueDate: {
    type: Date,
  },
  comments: [
    CommentSchema = {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Card", CardSchema);
