const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const ejs = require("ejs");

const app = express();
// Set the view engine to EJS
app.set("view engine", "ejs");

// Set the views directory
app.set("views", path.join(__dirname, "views"));

dotenv.config({ path: "../.env" }); 

const PORT = process.env.PORT || 5000;

const router = express.Router();
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.log(err);
  });

// Routes
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/faculty", require("./routes/facultyRoutes"));
app.use("/api/student", require("./routes/studentRoutes"));

//hello world for testing
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
