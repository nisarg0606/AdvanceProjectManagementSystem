const mongoose = require("mongoose");

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
    enum: ["active", "inactive", "completed", "rejected"],
    default: "active",
  },
  invite_code: {
    type: String,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  comments: [CommentSchema],
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
  project_type: {
    type: String,
    enum: ["IDP (Industry Defined Project)", "UDP (User Defined Project)"],
    default: "UDP (User Defined Project)",
  },
  company: {
    type: String,
  },
  company_email: {
    type: String,
  },
  frontendTechnologies: {
    type: String,
  },
  backendTechnologies: {
    type: String,
  },
  databaseTechnologies: {
    type: String,
  },
});

module.exports = mongoose.model("Project", ProjectSchema);