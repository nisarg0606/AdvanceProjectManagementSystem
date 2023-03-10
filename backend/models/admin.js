const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
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
        return /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#\$%\^&\*])(?=.{8,})/.test(
          v
        );
      },
      message: (props) =>
        `${props.value} is not a valid password! Password must contain at least one uppercase letter, one lowercase letter, one number, one special character, and be at least 8 characters long.`,
    },
  },
  role: {
    type: String,
    default: "admin",
  },
});

module.exports = mongoose.model("Admin", AdminSchema);