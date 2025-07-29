'use server';
/**
 * @fileOverview A Genkit flow for verifying OTPs.
 *
 * - verifyOtp - A function that handles verifying an OTP.
 * - VerifyOtpInput - The input type for the verifyOtp function.
 * - VerifyOtpOutput - The return type for the verifyOtp function.
 */

import { ai } from '@/ai/genkit';
import { verifyOtp as verifyOtpService } from '@/services/twilio';
import { z } from 'genkit';

export const VerifyOtpInputSchema = z.object({
    phoneNumber: z.string().describe('The phone number the OTP was sent to.'),
    code: z.string().describe('The OTP code to verify.'),
});
export type VerifyOtpInput = z.infer<typeof VerifyOtpInputSchema>;

export const VerifyOtpOutputSchema = z.object({
  success: z.boolean().describe('Whether the OTP was verified successfully.'),
  error: z.string().optional().describe('The error message if verification failed.'),
});
export type VerifyOtpOutput = z.infer<typeof VerifyOtpOutputSchema>;

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
