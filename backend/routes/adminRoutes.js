const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const csvtojson = require("csvtojson");
const generator = require("generate-password");
const {
  sendWelcomeEmailWithPasswordToStudent,
  sendWelcomeEmailWithPasswordToFaculty,
} = require("../utils/mailConfig");
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
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    const students = await Student.find();
    const faculties = await Faculty.find();
    const admins = await Admin.find();
    const data = {
      students,
      faculties,
      admins,
    };
    res.status(200).send(data);
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
        password: generateRandomPassword(),
        passwordChanged: false,
      };
    });
    //if csv contains duplicate enrollment numbers or emails
    const enrollmentNumbers = userObjects.map((user) => user.enrollment_number);
    const emails = userObjects.map((user) => user.email);
    const duplicateEnrollmentNumbers = enrollmentNumbers.filter(
      (enrollmentNumber, index) =>
        enrollmentNumbers.indexOf(enrollmentNumber) !== index
    );
    const duplicateEmails = emails.filter(
      (email, index) => emails.indexOf(email) !== index
    );
    if (duplicateEnrollmentNumbers.length > 0) {
      return res.status(400).send("Duplicate enrollment numbers");
    }
    if (duplicateEmails.length > 0) {
      return res.status(400).send("Duplicate emails");
    }
    //check if any of the students already exist
    const existingStudents = await Student.find({
      email: { $in: userObjects.map((user) => user.email) },
      enrollment_number: {
        $in: userObjects.map((user) => user.enrollment_number),
      },
    });
    if (existingStudents.length > 0) {
      return res.status(400).send("Some students already exist");
    }

    const result = await Student.insertMany(userObjects);
    // Send welcome email to all students
    try {
      userObjects.forEach(async (user) => {
        await sendWelcomeEmailWithPasswordToStudent(
          user.email,
          user.name,
          user.password
        );
        //sleep for 15 seconds
        await new Promise((resolve) => setTimeout(resolve, 15000));
      });
    } catch (err) {
      console.log(err);
    }
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
      ignoreColumns: /(name, email, department, phoneNumber)/,
    }).fromString(req.file.buffer.toString());

    // Create an array of user objects with the default password and the passwordChanged flag set to false
    const userObjects = faculties.map((faculty) => {
      // console.log(faculty);
      return {
        email: faculty.email,
        name: faculty.name,
        department: faculty.department,
        phoneNumber: faculty.phoneNumber,
        role: "faculty",
        password: generateRandomPassword(),
        passwordChanged: false,
      };
    });
    //if csv contains duplicate emails
    const emails = userObjects.map((user) => user.email);
    const duplicateEmails = emails.filter(
      (email, index) => emails.indexOf(email) !== index
    );
    if (duplicateEmails.length > 0) {
      return res.status(400).send("Duplicate emails");
    }
    //check if any of the faculties already exist
    const existingFaculties = await Faculty.find({
      email: { $in: userObjects.map((user) => user.email) },
    });
    if (existingFaculties.length > 0) {
      return res.status(400).send("Some faculties already exist");
    }
    //send email to all the faculties
    try {
      userObjects.forEach(async (user) => {
        await sendWelcomeEmailWithPasswordToStudent(
          user.name,
          user.email,
          user.password
        );
      });
    } catch (err) {
      console.error(err);
    }
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
    const password = generateRandomPassword();
    const student = new Student({
      email,
      name,
      enrollment_number,
      department,
      role: "student",
      password,
      passwordChanged: false,
    });
    const result = await student.save();

    // Send welcome email to the new student
    try {
      await sendWelcomeEmailWithPasswordToStudent(email, name, password);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to send welcome email" });
    }

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
    const { email, name, department, phoneNumber } = req.body;
    const faculty = new Faculty({
      email,
      name,
      department,
      phoneNumber,
      role: "faculty",
      password: generateRandomPassword(),
      passwordChanged: false,
    });
    const result = await faculty.save();
    // Send welcome email to the new faculty
    try {
      await sendWelcomeEmailWithPasswordToFaculty(
        email,
        name,
        generateRandomPassword()
      );
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Failed to send welcome email" });
    }

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

function generateRandomPassword() {
  //   password should contain atleast 1 uppercase, 1 lowercase, 1 number and 1 special character
  //npm i password-generator
  const password = generator.generate({
    length: 10,
    numbers: true,
    symbols: true,
    uppercase: true,
    exclude: "{}/\\[]()<>~`!$%^&+=|;:,\"?'",
    strict: true,
  });
  console.log(password);
  return password;
}

// @route   DELETE api/admin/delete-student/:id
// @desc    delete student
// @access  Private
router.delete("/delete-student/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    let student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    student = student.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Student removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE api/admin/delete-faculty/:id
// @desc    Remove faculty
// @access  Private
router.delete("/delete-faculty/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    let faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    faculty = faculty.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Faculty removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET api/admin/students
// @desc    Get all students
// @access  Private
router.get("/students", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET api/admin/faculties
// @desc    Get all faculties
// @access  Private
router.get("/faculties", auth, async (req, res) => {
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
    // sent student data and message
    const message = "Student updated";
    res.status(200).json(student, message);
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
    // sent faculty data and message
    const message = "Faculty updated";
    res.status(200).json(faculty, message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET api/admin/get-student-by-enrollment/:enrollment_number
// @desc    Get student by enrollment number
// @access  Private
router.get(
  "/get-student-by-enrollment/:enrollment_number",
  auth,
  async (req, res) => {
    try {
      if (req.user.role !== "admin")
        return res.status(401).send("Unauthorized");
      const enrollment_number = req.params.enrollment_number;
      const student = await Student.findOne({ enrollment_number });
      if (!student)
        return res.status(404).json({ message: "Student not found" });
      res.status(200).json(student);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  }
);

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

//get all users on the dashboard
// @route   GET api/admin/dashboard
// @desc    Get all users, admins, students and faculties
// @access  Private
router.get("/dashboard", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    const admins = await Admin.find();
    const students = await Student.find();
    const faculties = await Faculty.find();
    const dashboard = {};
    dashboard.admins = admins;
    dashboard.students = students;
    dashboard.faculties = faculties;
    res.status(200).json(dashboard);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
});
module.exports = router;
