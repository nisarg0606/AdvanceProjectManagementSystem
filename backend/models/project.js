const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Faculty",
    default: null,
    required: false, // change to true later
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
  ],
  status: {
    type: String,
    enum: ["active", "inactive", "completed"],
    default: "active",
  },
  invite_code: {
    type: String,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  comments: [
    {
      content: {
        type: String,
        // required: true,
      },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ["Student", "Faculty"],
        // required: true,
      },
    },
  ],
  capacity: {
    type: Number,
    default: 4,
  },
  repository_link: {
    type: String,
    default: "",
  },
  report_link: {
    type: String,
    default: "",
  },
  presentation_link: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("Project", ProjectSchema);