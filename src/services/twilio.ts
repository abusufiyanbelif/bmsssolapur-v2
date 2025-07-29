/**
 * @fileOverview Twilio service for sending and verifying OTPs.
 *
 * - sendOtp - A function to send an OTP.
 * - verifyOtp - A function to verify an OTP.
 */

import twilio from 'twilio';

// In a real application, you should use environment variables
// to store sensitive information like Twilio credentials.
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifySid = process.env.TWILIO_VERIFY_SID;

const client = twilio(accountSid, authToken);

/**
 * Sends an OTP to a phone number using Twilio Verify.
 * @param phoneNumber The recipient's phone number in E.164 format.
 */
export async function sendOtp(phoneNumber: string) {
  if (!verifySid) {
    throw new Error('Twilio Verify Service SID is not configured.');
  }
  try {
    const verification = await client.verify.v2.services(verifySid)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' });
    console.log(`OTP sent to ${phoneNumber}. Status: ${verification.status}`);
    return verification;
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new Error('Failed to send OTP.');
  }
}

/**
 * Verifies an OTP code for a given phone number.
 * @param phoneNumber The recipient's phone number in E.164 format.
 * @param code The OTP code to verify.
 * @returns True if the code is valid, false otherwise.
 */
export async function verifyOtp(phoneNumber: string, code: string): Promise<boolean> {
    if (!verifySid) {
        throw new Error('Twilio Verify Service SID is not configured.');
    }
    try {
        const verificationCheck = await client.verify.v2.services(verifySid)
            .verificationChecks
            .create({ to: phoneNumber, code: code });
        
        return verificationCheck.status === 'approved';
    } catch (error) {
        console.error('Error verifying OTP:', error);
        // Twilio might return a 404 if the code is incorrect, which throws an error.
        // We can treat this as an invalid code.
        return false;
    }
}
