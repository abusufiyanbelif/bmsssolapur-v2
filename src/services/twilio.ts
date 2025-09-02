/**
 * @fileOverview Twilio service for sending and verifying OTPs.
 *
 * - sendOtp - A function to send an OTP.
 * - verifyOtp - A function to verify an OTP.
 */

import twilio from 'twilio';
import { config } from '@/lib/config';

// In a real application, you should use environment variables
// to store sensitive information like Twilio credentials.
const accountSid = config.twilio.accountSid;
const authToken = config.twilio.authToken;
const verifySid = config.twilio.verifySid;

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

/**
 * Verifies the Twilio client configuration by trying to fetch the Verify service.
 */
export async function testTwilioConnection(): Promise<void> {
    if (!accountSid || !authToken || !verifySid) {
        throw new Error('Twilio credentials (Account SID, Auth Token, Verify SID) are not fully configured.');
    }
    try {
        await client.verify.v2.services(verifySid).fetch();
    } catch (error: any) {
        console.error('Twilio connection verification failed:', error);
        if (error.status === 401) {
            throw new Error("Authentication failed. Please check your Twilio Account SID and Auth Token.");
        }
        if (error.status === 404) {
            throw new Error(`The Verify Service with SID "${verifySid}" was not found.`);
        }
        throw new Error("Failed to connect to Twilio. Check credentials and network.");
    }
}
