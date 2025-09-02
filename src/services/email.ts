/**
 * @fileOverview Email service for sending emails using Nodemailer.
 *
 * - sendEmail - A function to send an email.
 */

import nodemailer from 'nodemailer';
import { config } from '@/lib/config';

// This is a placeholder for your email configuration.
// In a real application, you should use environment variables
// to store sensitive information like email credentials.
const transporter = nodemailer.createTransport({
  host: config.smtp.host || 'smtp.ethereal.email',
  port: parseInt(config.smtp.port || '587', 10),
  secure: (config.smtp.secure === 'true'), // true for 465, false for other ports
  auth: {
    user: config.smtp.user || 'your-email@example.com', // generated ethereal user
    pass: config.smtp.pass || 'your-password', // generated ethereal password
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
    from: config.emailFrom || '"Baitul Mal Samajik Sanstha" <no-reply@example.com>',
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


/**
 * Verifies the Nodemailer transporter configuration.
 */
export async function testNodemailerConnection(): Promise<void> {
    try {
        await transporter.verify();
        console.log("Nodemailer connection verified successfully.");
    } catch(error) {
        console.error("Nodemailer connection verification failed:", error);
        if (error instanceof Error) {
            // Provide a more user-friendly error message for common issues
            if (error.message.includes('Invalid login')) {
                throw new Error("Authentication failed. Please check your SMTP username and password.");
            }
             if (error.message.includes('ETIMEDOUT')) {
                throw new Error("Connection timed out. Please check your SMTP host and port, and ensure no firewalls are blocking the connection.");
            }
        }
        throw new Error("Failed to connect to SMTP server. Check configuration and credentials.");
    }
}
