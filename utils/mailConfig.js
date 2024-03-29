const nodemailer = require("nodemailer");
const ejs = require("ejs");
const fs = require("fs");
const path = require("path");
const sendWelcomeEmailWithPasswordToStudentPath = path.join(__dirname, '..', 'views', 'welcome-student.ejs');
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'vickie41@ethereal.email',
        pass: 'jUrtv2TcsDmQJBDpeC'
    }
});
// var transport = nodemailer.createTransport("SMTP", {
//   service: "hotmail",
//   auth: {
//       user: "user@outlook.com",
//       pass: "password"
//   }
// });

const sendWelcomeEmailWithPasswordToStudent = async (email, name, password) => {
    try {
        const emailTemplatePath = path.join(__dirname, '..', 'views', 'welcomeStudent.ejs');
    
        const html = await ejs.renderFile(emailTemplatePath, { name, email, password });
    
        await transporter.sendMail({
          from: process.env.EMAIL_USERNAME,
          to: email,
          subject: 'Welcome to VSITR Project Management System',
          html
        });
    
        console.log(`Welcome email sent to ${email}`);
      } catch (error) {
        console.error(`Error sending welcome email to ${email}: ${error}`);
      }
};

const sendWelcomeEmailWithPasswordToFaculty = async (email, name, password) => {
    try {
        const emailTemplatePath = path.join(__dirname, '..', 'views', 'welcomeStudent.ejs');
    
        const html = await ejs.renderFile(emailTemplatePath, { name, email, password });
    
        await transporter.sendMail({
          from: process.env.EMAIL_USERNAME,
          to: email,
          subject: 'Welcome to VSITR Project Management System',
          html
        });
    
        console.log(`Welcome email sent to ${email}`);
      } catch (error) {
        console.error(`Error sending welcome email to ${email}: ${error}`);
      }
};
module.exports = {
  sendWelcomeEmailWithPasswordToStudent,
    sendWelcomeEmailWithPasswordToFaculty,
};
