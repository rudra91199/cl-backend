import nodemailer from 'nodemailer';

export const sendEmail = async ({ email, subject, message, html }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or your email provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"ClashLab Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    text: message,
    html: html || message // Use HTML if provided, fallback to plain text
  };

  await transporter.sendMail(mailOptions);
};