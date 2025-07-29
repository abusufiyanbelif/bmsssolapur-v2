
'use server';
/**
 * @fileOverview A Genkit flow for sending OTPs.
 *
 * - sendOtp - A function that handles sending an OTP.
 */

import { ai } from '@/ai/genkit';
import { sendOtp as sendOtpService } from '@/services/twilio';
import { 
    SendOtpInput, 
    SendOtpInputSchema, 
    SendOtpOutput,
    SendOtpOutputSchema 
} from '@/ai/schemas';


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
