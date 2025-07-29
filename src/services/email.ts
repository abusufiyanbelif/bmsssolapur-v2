/**
 * @fileOverview Email service for sending emails using Nodemailer.
 *
 * - sendEmail - A function to send an email.
 */

import nodemailer from 'nodemailer';

// This is a placeholder for your email configuration.
// In a real application, you should use environment variables
// to store sensitive information like email credentials.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: (process.env.SMTP_SECURE === 'true'), // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@example.com', // generated ethereal user
    pass: process.env.SMTP_PASS || 'your-password', // generated ethereal password
  },
});

/**
 * Sends an email using Nodemailer.
 * @param to The recipient's email address.
 * @param subject The subject of the email.
 * @param html The HTML body of the email.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Baitul Mal Samajik Sanstha" <no-reply@example.com>',
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email.');
  }
}
