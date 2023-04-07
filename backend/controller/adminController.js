const express = require("express");

const Student = require("../models/student");
const Faculty = require("../models/faculty");
const Admin = require("../models/admin");
const {
  sendWelcomeEmailWithPasswordToStudent,
} = require("../utils/mailConfig");
const { generateRandomPassword } = require("../utils/helperFuntions");

exports.getAllUsers = async (req, res) => {
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
};

exports.addStudentsUsingCsv = async (req, res) => {
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
};

exports.addFacultiesUsingCsv = async (req, res) => {
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
};

exports.addStudent = async (req, res) => {
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
};

exports.addFaculty = async (req, res) => {
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
      await sendWelcomeEmailWithPasswordToStudent(
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
};

exports.deleteStudentById = async (req, res) => {
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
};

exports.deleteFacultyById = async (req, res) => {
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
};

exports.getStudents = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    const students = await Student.find();
    res.status(200).json(students);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getFaculties = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    const faculties = await Faculty.find();
    res.status(200).json(faculties);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getFacultyById = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    res.status(200).json(faculty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateStudentById = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    const { email, name, enrollment_number, department } = req.body;
    student.email = email;
    student.name = name;
    student.enrollment_number = enrollment_number;
    student.department = department;
    const result = await student.save();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateFacultyById = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(401).send("Unauthorized");
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });
    const { email, name, department, phoneNumber } = req.body;
    faculty.email = email;
    faculty.name = name;
    faculty.department = department;
    faculty.phoneNumber = phoneNumber;
    const result = await faculty.save();
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.resestStudentPassword = async (req, res) => {
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
};
