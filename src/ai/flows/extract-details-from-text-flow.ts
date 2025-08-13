

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

            First, try to identify the payment app used. Then apply the specific rules for that app.

            **PhonePe Rules:**
            - The app is likely PhonePe if you see the word "पे" at the top.
            - The recipient's name is under the "Paid to" section.
            - The recipient's UPI ID is on the line directly below their name.
            - The UTR number is labeled "UTR:" and is found under the "Debited from" section. Use this for the 'utrNumber' field.
            - The main Transaction ID is labeled "Transaction ID".
            - The sender's name may not be present. The sender's account number will be partially visible under "Debited from".

            **Google Pay (GPay) Rules:**
            - Look for "From:" and "To:" labels to identify sender and recipient blocks.
            - The sender's name is on the first line of the "From:" block. Clean it up by removing any bank name in parentheses (e.g., "(ICICI Bank)").
            - The sender's UPI ID is on the line immediately following the sender's name and contains an '@' symbol.
            - The recipient's name is on the first line of the "To:" block.
            - The recipient's UPI ID is on the line immediately following the recipient's name and contains an '@' symbol.
            
            **General Fields to Extract:**
            - amount: The primary transaction amount. Must be a number.
            - transactionId: The main Transaction ID or Reference Number. Use the "UPI transaction ID" if present on a GPay receipt.
            - utrNumber: The UTR number, if it is explicitly labeled as such (common on PhonePe receipts).
            - date: The date of the transaction. Format as YYYY-MM-DD.
            - time: The time of the transaction, e.g., "11:48 am".
            - paymentApp: The app used (e.g., GPay, PhonePe, Paytm). Infer from UI hints like 'G Pay' or 'पे' logo text.
            - paymentMethod: The method used, like "UPI" or "Bank Transfer".
            - senderName: The full name of the person who sent the money.
            - senderUpiId: The sender's UPI ID.
            - senderAccountNumber: The sender's bank account number, even if partial (e.g., "...1234").
            - recipientName: The full name of the person who received the money.
            - recipientPhone: The recipient's phone number if it is shown near their name.
            - recipientAccountNumber: The recipient's bank account number, even if partial.
            - recipientUpiId: The recipient's UPI ID.
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
