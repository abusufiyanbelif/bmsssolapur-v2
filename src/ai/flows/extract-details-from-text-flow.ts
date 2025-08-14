

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

            First, try to identify the payment app used (PhonePe, GPay, Paytm, etc.). Then apply the specific rules for that app and populate the app-specific fields.

            **PhonePe Rules:**
            - The app is likely PhonePe if you see "पे" at the top or "PhonePe" text.
            - The sender's name is under the "Paid from" or "Debited from" section. Use this for 'phonePeSenderName'.
            - The recipient's name is under the "To" or "Paid to" section. Use this for 'phonePeRecipientName'.
            - The recipient's UPI ID is often on the line directly below their name.
            - The UTR number is labeled "UTR:" and is found under the "Debited from" section. Use this for the 'utrNumber' field.
            - The main Transaction ID is labeled "Transaction ID".

            **Google Pay (GPay) Rules:**
            - Look for "From:" and "To:" labels to identify sender and recipient blocks.
            - The sender's name is on the first line of the "From:" block. Clean it up by removing any bank name in parentheses (e.g., "(ICICI Bank)"). Use this for 'googlePaySenderName'.
            - The sender's UPI ID is on the line immediately following the sender's name and contains an '@' symbol.
            - The recipient's name is on the first line of the "To:" block. Use this for 'googlePayRecipientName'.
            - The recipient's UPI ID is on the line immediately following the recipient's name and contains an '@' symbol.
            - The "UPI transaction ID" should be prioritized for the transactionId field. The "Google transaction ID" is secondary.

            **Paytm Rules:**
            - Look for "From" and "To" sections.
            - The sender's name is usually next to "From". Use this for 'paytmSenderName'.
            - The recipient's name is usually next to "To". Use this for 'paytmRecipientName'.
            - The "UPI Reference No." is the most important transaction identifier. Prioritize this for the 'transactionId' field.

            **General Fields to Extract:**
            - paymentApp: The app used (e.g., GPay, PhonePe, Paytm).
            - amount: The primary transaction amount. Must be a number.
            - transactionId: The main Transaction ID, Reference Number, or UPI Reference No.
            - utrNumber: The UTR number, if explicitly labeled.
            - date: The date of the transaction (Format: YYYY-MM-DD).
            - time: The time of the transaction (e.g., "11:48 am").
            - paymentMethod: The method used, like "UPI" or "Bank Transfer".
            - senderName: The generic sender name. If possible, prefer the app-specific name.
            - senderUpiId: The sender's UPI ID.
            - senderAccountNumber: The sender's bank account number, even if partial.
            - recipientName: The generic recipient name. If possible, prefer the app-specific name.
            - recipientPhone: The recipient's phone number if it is shown near their name.
            - recipientUpiId: The recipient's UPI ID.
            - recipientAccountNumber: The recipient's bank account number, even if partial.
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
