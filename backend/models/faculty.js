const mongoose = require("mongoose");

const FacultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email address!`,
    },
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#\$%\^&\*])(?=.{8,})/.test(
          v
        );
      },
      message: (props) =>
        `${props.value} is not a valid password! Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long.`,
    },
  },
  passwordChanged: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: "faculty",
    default: "faculty",
  },
  // phone should contain 10 digits
  phoneNumber: {
    type: String,
    required: true,
  },
  department: {
    type: String,
    default: "Computer Engineering",
    required: true,
  },
  designation: {
    type: String,
    default: "Assistant Professor",
    required: true,
  },
  //maxiumum faculty members can take max projects
  maxProjects: {
    type: Number,
    default: 10,
    required: true,
  },
  projects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
  ],
  projectCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Faculty", FacultySchema);
