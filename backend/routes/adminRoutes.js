const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const csvtojson = require("csvtojson");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only csv files
    if (!file.originalname.match(/\.(csv)$/)) {
      return cb(new Error("Please upload a CSV file."));
    }
    cb(null, true);
  },
});

const Student = require("../models/student");
const Faculty = require("../models/faculty");
const Admin = require("../models/admin");

// @route   GET api/admin
// @desc    Get all users
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const students = await Student.find();
    const faculties = await Faculty.find();
    const admins = await Admin.find();
    const users = [...students, ...faculties, ...admins];
    res.status(200).json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  }
});

// @route   POST api/admin/add-students
// @desc    Add students using csv file
// @access  Private
router.post("/add-students", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Please upload a file.");
    if (!req.file.originalname.match(/\.(csv)$/))
      return res.status(400).send("Please upload a CSV file.");
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    // Convert CSV buffer to JSON
    const students = await csvtojson({
      // ignore first row
      ignoreEmpty: true,
      ignoreColumns: /(email, name, enrollment_number, department)/,
    }).fromString(req.file.buffer.toString());

    // Create an array of user objects with the default password and the passwordChanged flag set to false
    const userObjects = students.map((student) => {
      return {
        email: student.email,
        name: student.name,
        role: "student",
        enrollment_number: student.enrollment_number,
        department: student.department,
        password: process.env.DEFAULT_PASSWORD,
        passwordChanged: false,
      };
    });
    const result = await Student.insertMany(userObjects);
    res.status(201).send(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send(err.message);
  } finally {
    // Delete the uploaded file
    if (req.file) req.file.buffer = null;
  }
});

// @route   POST api/admin/add-faculties
// @desc    Add faculties using csv file
// @access  Private
router.post("/add-faculties", auth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("Please upload a file.");
    if (!req.file.originalname.match(/\.(csv)$/))
      return res.status(400).send("Please upload a CSV file.");
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    // Convert CSV buffer to JSON
    const faculties = await csvtojson({
      // ignore first row
      ignoreEmpty: true,
      ignoreColumns: /(name,email, department)/,
    }).fromString(req.file.buffer.toString());

    // Create an array of user objects with the default password and the passwordChanged flag set to false
    const userObjects = faculties.map((faculty) => {
      // console.log(faculty);
      return {
        email: faculty.email,
        name: faculty.name,
        department: faculty.department,
        role: "faculty",
        password: process.env.DEFAULT_PASSWORD,
        passwordChanged: false,
      };
    });

    const result = await Faculty.insertMany(userObjects);

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  } finally {
    // Flush the memory
    if (req.file && req.file.buffer) {
      req.file.buffer = null;
    }
  }
});

// @route   POST api/admin/add-student
// @desc    Add single student
// @access  Private
router.post("/add-student", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const { email, name, enrollment_number, department } = req.body;
        const student = new Student({
            email,
            name,
            enrollment_number,
            department,
            role: "student",
            password: process.env.DEFAULT_PASSWORD,
            passwordChanged: false,
        });
        const result = await student.save();
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   POST api/admin/add-faculty
// @desc    Add single faculty
// @access  Private
router.post("/add-faculty", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const { email, name, department } = req.body;
        const faculty = new Faculty({
            email,
            name,
            department,
            role: "faculty",
            password: process.env.DEFAULT_PASSWORD,
            passwordChanged: false,
        });
        const result = await faculty.save();
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE api/admin/remove-student/:id
// @desc    Remove student
// @access  Private
router.delete("/remove-student/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        await student.remove();
        res.status(200).json({ message: "Student removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE api/admin/remove-faculty/:id
// @desc    Remove faculty
// @access  Private
router.delete("/remove-faculty/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) return res.status(404).json({ message: "Faculty not found" });
        await faculty.remove();
        res.status(200).json({ message: "Faculty removed" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/admin/get-students
// @desc    Get all students
// @access  Private
router.get("/get-students", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const students = await Student.find();
        res.status(200).json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/admin/get-faculties
// @desc    Get all faculties
// @access  Private
router.get("/get-faculties", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const faculties = await Faculty.find();
        res.status(200).json(faculties);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/admin/get-student/:id
// @desc    Get student by id
// @access  Private
router.get("/get-student/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.status(200).json(student);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/admin/get-faculty/:id
// @desc    Get faculty by id
// @access  Private
router.get("/get-faculty/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) return res.status(404).json({ message: "Faculty not found" });
        res.status(200).json(faculty);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT api/admin/update-student/:id
// @desc    Update student
// @access  Private
router.put("/update-student/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const { email, name, enrollment_number, department } = req.body;
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        student.email = email;
        student.name = name;
        student.enrollment_number = enrollment_number;
        student.department = department;
        await student.save();
        res.status(200).json(student);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT api/admin/update-faculty/:id
// @desc    Update faculty
// @access  Private
router.put("/update-faculty/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const { email, name, department } = req.body;
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) return res.status(404).json({ message: "Faculty not found" });
        faculty.email = email;
        faculty.name = name;
        faculty.department = department;
        await faculty.save();
        res.status(200).json(faculty);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/admin/get-student-by-enrollment/:enrollment_number
// @desc    Get student by enrollment number
// @access  Private
router.get("/get-student-by-enrollment/:enrollment_number", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const enrollment_number = req.params.enrollment_number;
        const student = await Student.findOne({ enrollment_number });
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.status(200).json(student);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/admin/get-faculty-by-email/:email
// @desc    Get faculty by email
// @access  Private
router.get("/get-faculty-by-email/:email", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const email = req.params.email;
        const faculty = await Faculty.findOne({ email });
        if (!faculty) return res.status(404).json({ message: "Faculty not found" });
        res.status(200).json(faculty);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/admin/get-student-by-email/:email
// @desc    Get student by email
// @access  Private
router.get("/get-student-by-email/:email", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const email = req.params.email;
        const student = await Student.findOne({ email });
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.status(200).json(student);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/admin/reset-student-password/:id
// @desc    Reset student password
// @access  Private
router.get("/reset-student-password/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: "Student not found" });
        student.password = process.env.DEFAULT_PASSWORD;
        await student.save();
        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

// @route   GET api/admin/reset-faculty-password/:id
// @desc    Reset faculty password
// @access  Private
router.get("/reset-faculty-password/:id", auth, async (req, res) => {
    try {
        if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
        const faculty = await Faculty.findById(req.params.id);
        if (!faculty) return res.status(404).json({ message: "Faculty not found" });
        faculty.password = process.env.DEFAULT_PASSWORD;
        await faculty.save();
        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
