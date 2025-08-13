

'use server';
/**
 * @fileOverview A Genkit flow for extracting donation details from raw text.
 * 
 * - extractDetailsFromText - A function that performs data extraction from a block of text.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    ExtractDetailsFromTextInput,
    ExtractDetailsFromTextInputSchema,
    ExtractDonationDetailsOutput,
    ExtractDonationDetailsOutputSchema
} from '@/ai/schemas';


export async function extractDetailsFromText(input: ExtractDetailsFromTextInput): Promise<ExtractDonationDetailsOutput> {
  return extractDetailsFromTextFlow(input);
}


const extractDetailsFromTextFlow = ai.defineFlow(
  {
    name: 'extractDetailsFromTextFlow',
    inputSchema: ExtractDetailsFromTextInputSchema,
    outputSchema: ExtractDonationDetailsOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: [
            { text: `You are an expert financial assistant specializing in parsing text from payment receipts. Analyze the provided block of raw text, which was extracted via OCR from a payment screenshot. Your task is to carefully extract the following details. Be precise. If a field is not present in the text, omit it entirely from the output. The text might have OCR errors, so be robust in your parsing.

            - amount: The primary transaction amount. Must be a number.
            - transactionId: The main Transaction ID or Reference Number. Use the "UPI transaction ID" if present.
            - utrNumber: The UTR number, if it is explicitly labeled as such.
            - date: The date of the transaction. Format as YYYY-MM-DD.
            - time: The time of the transaction, e.g., "11:48 am".
            - paymentApp: The app used (e.g., GPay, PhonePe, Paytm). Infer from UI hints like 'G Pay' logo text.
            - paymentMethod: The method used, like "UPI" or "Bank Transfer".
            - senderName: The full name of the person who sent the money. Look for a "From:" section and extract the name. Clean up any extra text like "(ICICI Bank)".
            - senderUpiId: The sender's UPI ID. Look for a UPI ID (containing '@') directly following the sender's name or on the next line.
            - senderAccountNumber: The sender's bank account number, even if partial (e.g., "...1234").
            - recipientName: The full name of the person who received the money. Look for a "To:" section and extract the name (e.g., "To SALMAN SANAULLAH SH").
            - recipientAccountNumber: The recipient's bank account number, even if partial.
            - recipientUpiId: The recipient's UPI ID. This is often found directly under or on the next line after the recipient's name and contains an '@' symbol (e.g., "dr.salmanshaik@okaxis").
            - status: The transaction status (e.g., Successful, Completed).
            - notes: Any user-added comments, remarks, or descriptions.

            Raw Text to Parse:
            ---
            ${input.rawText}
            ---
            ` },
        ],
        output: {
            schema: ExtractDonationDetailsOutputSchema
        }
    });
    
    const output = llmResponse.output;

    if (!output) {
      throw new Error("The AI model did not return any output from the text.");
    }

    return output;
  }
);
