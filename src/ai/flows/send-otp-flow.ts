'use server';
/**
 * @fileOverview A Genkit flow for sending OTPs.
 *
 * - sendOtp - A function that handles sending an OTP.
 * - SendOtpInput - The input type for the sendOtp function.
 * - SendOtpOutput - The return type for the sendOtp function.
 */

import { ai } from '@/ai/genkit';
import { sendOtp as sendOtpService } from '@/services/twilio';
import { z } from 'genkit';

export const SendOtpInputSchema = z.object({
  phoneNumber: z.string().describe('The phone number to send the OTP to.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

export const SendOtpOutputSchema = z.object({
  success: z.boolean().describe('Whether the OTP was sent successfully.'),
  error: z.string().optional().describe('The error message if the OTP failed to send.'),
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;

export async function sendOtp(input: SendOtpInput): Promise<SendOtpOutput> {
  return sendOtpFlow(input);
}

const sendOtpFlow = ai.defineFlow(
    {
      name: 'sendOtpFlow',
      inputSchema: SendOtpInputSchema,
      outputSchema: SendOtpOutputSchema,
    },
    async (input) => {
      try {
        await sendOtpService(input.phoneNumber);
        return { success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, error: errorMessage };
      }
    }
);
