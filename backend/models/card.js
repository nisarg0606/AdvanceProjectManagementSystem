const mongoose = require("mongoose");

const CommentsSchema = new mongoose.Schema({
  comment: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    // it can be a faculty or a student
    ref: "onModel",
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  onModel: {
    type: String,
    enum: ["Student", "Faculty"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CardSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "List",
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
        CommentsSchema
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