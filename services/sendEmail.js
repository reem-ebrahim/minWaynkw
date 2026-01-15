const nodemailer = require("nodemailer");
require('dotenv').config()

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // reemsina2@gmail.com
    pass: 'lhid gzgm wqrd tiih', // app password
  },
});

/* ===============================
   Confirm Email
================================ */
const sendConfirmationEmail = async ({ to, name, link }) => {
  return transporter.sendMail({
    from: `"My App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your email",
    html: `
      <h3>Hello ${name}</h3>
      <p>Please Verify your email by clicking the link below:</p>
      ${link}
    `,
  });
};

/* ===============================
   Code Email (OTP)
================================ */
const sendCodeEmail = async ({ to, code }) => {
  return transporter.sendMail({
    from: `"My App" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your verification code",
    html: `<h3>Your code is: ${code}</h3>`,
  });
};

module.exports = {
  sendConfirmationEmail,
  sendCodeEmail,
};
