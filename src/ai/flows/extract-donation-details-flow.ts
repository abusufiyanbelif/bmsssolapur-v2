
'use server';
/**
 * @fileOverview A Genkit flow for extracting donation details from raw text.
 * 
 * - extractDetailsFromText - a function that performs data extraction from a block of text.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    ExtractDetailsFromTextInputSchema,
    ExtractDetailsFromTextInput,
    ExtractDonationDetailsOutput,
    ExtractDonationDetailsOutputSchema
} from '@/ai/schemas';
import { getSafeGeminiModel } from '@/services/gemini-service';


export async function extractDonationDetails(input: ExtractDetailsFromTextInput): Promise<ExtractDonationDetailsOutput> {
  return extractDetailsFromTextFlow(input);
}


const extractDetailsFromTextFlow = ai.defineFlow(
  {
    name: 'extractDetailsFromTextFlow',
    inputSchema: ExtractDetailsFromTextInputSchema,
    outputSchema: ExtractDonationDetailsOutputSchema,
  },
  async (input) => {
    
    const modelName = await getSafeGeminiModel();
    const {output} = await ai.generate({
        model: googleAI.model(modelName),
        prompt: `You are an expert financial assistant specializing in parsing text from payment receipts. Analyze the provided block of raw text, which was extracted via OCR from a payment screenshot. Your task is to carefully extract the following details. Be precise. If a field is not present in the text, omit it entirely from the output. The text might have OCR errors, so be robust in your parsing.

            **Primary Goal: Find UPI IDs. A UPI ID is any string containing an '@' symbol (e.g., username@okaxis).**

            **PhonePe Rules:**
            - The overall app is likely PhonePe if you see "पे" at the top or "PhonePe" text. This should be set as the 'senderPaymentApp' and 'paymentApp'. However, **ALWAYS check the 'Debited from' section**. If it mentions another app like 'Paytm', the 'senderPaymentApp' should be 'Paytm'.
            - The sender's name might appear under "Debited from". Extract it for 'phonePeSenderName' and 'senderName'.
            - The recipient's name is under the "Paid to" section. Use this for 'phonePeRecipientName' and 'recipientName'.
            - The recipient's UPI ID is often on the line directly below their name, or next to it. Capture this for 'recipientUpiId'.
            - "Transaction ID" on a PhonePe receipt should be mapped to 'phonePeTransactionId'. If the debit source is NOT PhonePe, do not use this as the primary 'transactionId'.
            - **"UTR" or "UTR No" should ALWAYS be mapped to 'utrNumber' and is often the most reliable primary transaction ID in cross-app transactions.**

            **Google Pay (GPay) Rules:**
            - Look for "From:" and "To:" labels to identify sender and recipient blocks.
            - The sender's name is likely on the lines following "From:". Combine text to get the full name. Clean it up by removing any bank name in parentheses (e.g., "(IDBI Bank)"). Use this for 'googlePaySenderName' and 'senderName'.
            - The sender's bank name is often inside the parentheses next to their name in the "From:" section. Extract it for 'senderBankName'.
            - The sender's UPI ID is on the line immediately following the full sender name block and contains an '@' symbol. Use this for 'senderUpiId'.
            - The recipient's name is on the first line of the "To:" block. Clean it up by removing any bank name in parentheses. Use this for 'googlePayRecipientName' and 'recipientName'.
            - The recipient's phone number is sometimes shown near their name. Capture it for 'recipientPhone'.
            - The recipient's UPI ID is often shown below their name. Capture it for 'recipientUpiId'.
            - **CRITICAL: The "UPI transaction ID" is the most important ID. You MUST map its value to the main 'transactionId' field. This is the primary transaction identifier.**
            - If you see "Google transaction ID", map its value ONLY to the 'googlePayTransactionId' field. **DO NOT map the "Google transaction ID" to the 'utrNumber' or 'transactionId' field.**
            - **DO NOT capture a 'utrNumber' for Google Pay unless you see the explicit text "UTR" or "UTR No".**
            - Set 'paymentApp', 'senderPaymentApp', and 'recipientPaymentApp' to "Google Pay" unless there's evidence of another app being involved.
            
            **Paytm Rules:**
            - Look for "From" and "To" sections.
            - If "Debited from" says "Paytm", then 'senderPaymentApp' is "Paytm".
            - The sender's name is usually next to "From". Use this for 'paytmSenderName' and 'senderName'.
            - The recipient's name is usually next to "To". Use this for 'paytmRecipientName' and 'recipientName'.
            - **The "UPI Reference No." or "UTR" is the most important transaction identifier. Prioritize this for the 'transactionId' field.**
            - If you find a "Paytm UPI Reference No.", use it for the 'paytmUpiReferenceNo' field.

            **General Fields to Extract:**
            - paymentApp: The primary app used for the transaction. Prefer 'senderPaymentApp' if available.
            - senderPaymentApp: The app the sender used (e.g., PhonePe, Google Pay, Paytm). **This should be determined from the "Debited from" section if possible.**
            - recipientPaymentApp: The app the recipient received money on, if specified (e.g., 'Sent to: G Pay').
            - amount: The primary transaction amount. Must be a number.
            - transactionId: The main Transaction ID, Reference Number, or UPI Reference No. This is the most important unique identifier. **Prefer UTR number if available, especially in cross-app transactions.**
            - utrNumber: The UTR number, if explicitly labeled.
            - googlePayTransactionId: The Google Pay specific transaction ID.
            - phonePeTransactionId: The PhonePe specific transaction ID.
            - paytmUpiReferenceNo: The Paytm specific UPI Reference No.
            - date: The date of the transaction. **You MUST format this date as a full ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ).**
            - time: The time of the transaction (e.g., "11:48 am").
            - type: The category of donation if mentioned (e.g., Zakat, Sadaqah). Check the notes/remarks for this.
            - purpose: The specific purpose of the donation if mentioned (e.g., Education, Hospital). Check the notes/remarks for this.
            - paymentMethod: The method used, like "UPI" or "Bank Transfer". If you see "UPI", you MUST return "Online (UPI/Card)".
            - senderName: The generic sender name. If possible, prefer the app-specific name.
            - senderUpiId: The sender's UPI ID (contains '@').
            - senderAccountNumber: The sender's bank account number, even if partial.
            - senderBankName: The name of the sender's bank.
            - recipientName: The generic recipient name. If possible, prefer the app-specific name.
            - recipientPhone: The recipient's phone number if it is shown near their name.
            - recipientUpiId: The recipient's UPI ID (contains '@').
            - recipientAccountNumber: The recipient's bank account number, even if partial.
            - status: The transaction status (e.g., Successful, Completed, Received).
            - notes: Any user-added comments, remarks, or descriptions found in the payment details.
            - phonePeSenderName: The sender's name if it appears on a PhonePe receipt (rare).
            - phonePeRecipientName: The recipient's name from a PhonePe receipt.
            - googlePaySenderName: The sender's name from a Google Pay receipt.
            - googlePayRecipientName: The recipient's name from a Google Pay receipt.
            - paytmSenderName: The sender's name from a Paytm receipt.
            - paytmRecipientName: The recipient's name from a Paytm receipt.

            Raw Text to Parse:
            ---
            ${input.rawText}
            ---
            `,
        output: {
            schema: ExtractDonationDetailsOutputSchema
        }
    });

    if (!output) {
      throw new Error("The AI model did not return any output from the text.");
    }

    return output;
  }
);
