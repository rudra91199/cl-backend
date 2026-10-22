import nodemailer from 'nodemailer';

export const sendEmail = async ({ email, subject, message }) => {
  // Fallback for local testing if Gmail App Password isn't configured yet
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('\n========================================');
    console.log(`📧 [DEV EMAIL INTERCEPTOR] To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message:\n${message}`);
    console.log('========================================\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Monolith Terminal" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    text: message,
  });
};