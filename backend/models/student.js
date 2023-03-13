const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  enrollment_number: {
    type: String,
    required: true,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^[a-zA-Z ]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid name!`,
    },
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
        // password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long
        return /^(?=.*[!@#$%^&*(),.?":{}|<>])(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$/.test(
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
    enum: "student",
    default: "student",
  },
  department: {
    type: String,
    default: "CE",
    required: true,
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    default: null,
  },
  isLeader: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Student", StudentSchema);
