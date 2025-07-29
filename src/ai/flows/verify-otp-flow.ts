
'use server';
/**
 * @fileOverview A Genkit flow for verifying OTPs.
 *
 * - verifyOtp - A function that handles verifying an OTP.
 */

import { ai } from '@/ai/genkit';
import { verifyOtp as verifyOtpService } from '@/services/twilio';
import {
    VerifyOtpInput,
    VerifyOtpInputSchema,
    VerifyOtpOutput,
    VerifyOtpOutputSchema
} from '@/ai/schemas';


export async function verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpOutput> {
    return verifyOtpFlow(input);
}

const verifyOtpFlow = ai.defineFlow(
    {
      name: 'verifyOtpFlow',
      inputSchema: VerifyOtpInputSchema,
      outputSchema: VerifyOtpOutputSchema,
    },
    async (input) => {
      try {
        const success = await verifyOtpService(input.phoneNumber, input.code);
        if (success) {
            return { success: true };
        } else {
            return { success: false, error: 'Invalid OTP code.' };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: errorMessage };
      }
    }
);
