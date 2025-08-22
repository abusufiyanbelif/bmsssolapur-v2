

'use server';
/**
 * @fileOverview A Genkit flow for sending WhatsApp messages.
 *
 * - sendWhatsapp - A function that handles sending a WhatsApp message.
 */

import { ai } from '@/ai/genkit';
import { sendWhatsappMessage as sendWhatsappMessageService } from '@/services/whatsapp-service';
import { 
    SendWhatsappInput,
    SendWhatsappInputSchema,
    SendWhatsappOutput,
    SendWhatsappOutputSchema 
} from '@/ai/schemas';

export async function sendWhatsapp(input: SendWhatsappInput): Promise<SendWhatsappOutput> {
  return sendWhatsappFlow(input);
}

const sendWhatsappFlow = ai.defineFlow(
  {
    name: 'sendWhatsappFlow',
    inputSchema: SendWhatsappInputSchema,
    outputSchema: SendWhatsappOutputSchema,
  },
  async (input) => {
    try {
      await sendWhatsappMessageService(input.to, input.body);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      return { success: false, error: errorMessage };
    }
  }
);
