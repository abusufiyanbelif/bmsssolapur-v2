
'use server';
/**
 * @fileOverview A Genkit flow for sending emails.
 *
 * - sendEmail - A function that handles sending an email.
 */

import { ai } from '@/ai/genkit';
import { sendEmail as sendEmailService } from '@/services/email';
import { 
    SendEmailInput, 
    SendEmailInputSchema,
    SendEmailOutput,
    SendEmailOutputSchema 
} from '@/ai/schemas';

export async function sendEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  return sendEmailFlow(input);
}

const sendEmailFlow = ai.defineFlow(
  {
    name: 'sendEmailFlow',
    inputSchema: SendEmailInputSchema,
    outputSchema: SendEmailOutputSchema,
  },
  async (input) => {
    try {
      await sendEmailService(input.to, input.subject, input.body);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, error: errorMessage };
    }
  }
);
