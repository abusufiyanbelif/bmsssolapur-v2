
'use server';
/**
 * @fileOverview A Genkit flow for extracting structured lead details from a block of raw text.
 * 
 * - extractLeadDetailsFromText - a function that performs data extraction from text.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    ExtractLeadDetailsFromTextInputSchema,
    ExtractLeadDetailsFromTextInput,
    ExtractLeadDetailsOutputSchema,
    ExtractLeadDetailsOutput,
} from '@/ai/schemas';

export async function extractLeadDetailsFromText(input: ExtractLeadDetailsFromTextInput): Promise<ExtractLeadDetailsOutput> {
  return extractLeadDetailsFromTextFlow(input);
}


const extractLeadDetailsFromTextFlow = ai.defineFlow(
  {
    name: 'extractLeadDetailsFromTextFlow',
    inputSchema: ExtractLeadDetailsFromTextInputSchema,
    outputSchema: ExtractLeadDetailsOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: `You are an expert data entry assistant for a charity organization. Analyze the provided block of text, which may come from various documents like ID cards, medical bills, or handwritten notes. Your task is to carefully extract the following details. Be precise. If a field is not present, omit it entirely.

            **Key Instructions:**
            1.  **Generate a Compelling Story**: Based on all the text, synthesize a detailed narrative for the 'story' field. This should be suitable for a public audience to understand the beneficiary's situation and need for help.
            2.  **Identify Medical Conditions**: If the text is from a medical report (like Apollo Diagnostics), identify the specific disease, diagnosis, or abnormal test results (e.g., high ESR indicates inflammation). Use this information to set the 'purpose' to "Medical" and incorporate it into the story.
            3.  **Extract Beneficiary Details**: Carefully find the beneficiary's full name (often labeled 'Patient Name'), phone number, and address (from 'Patient location' or similar fields) from the text.
            
            **Fields to Extract:**
            - headline: A short, one-sentence summary of the case. If not explicit, create one from the story. For a medical report, it could be "Assistance needed for medical tests and treatment."
            - story: A detailed narrative of the beneficiary's situation, suitable for public display. Synthesize this from all available information in the text. If a medical condition is present, describe it clearly in the story. Use the "Comment" or "Impression" section of medical reports for this.
            - purpose: The primary purpose (e.g., Education, Medical, Relief Fund, Deen, Loan, Other). Infer "Medical" from lab reports or bills.
            - category: A more specific category if provided (e.g., School Fees, Ration Kit, Hospital Bill, Diagnostic Tests).
            - amount: The numeric value of the amount requested.
            - dueDate: The deadline for funds (Format: YYYY-MM-DD).
            - acceptableDonationTypes: An array of allowed donation types (e.g., ["Zakat", "Sadaqah"]).
            - caseDetails: The detailed story or reason for the request. Capture the full narrative for internal review.
            
            - beneficiaryName: The full name of the person needing help. Look for "Name" or "Patient Name" or similar labels.
            - beneficiaryPhone: The 10-digit phone number of the beneficiary. Look for "Mobile", "Phone", or similar labels.
            - fatherName: The beneficiary's father's name. Look for "S/O", "Son of", or "Father's Name".
            - beneficiaryEmail: The beneficiary's email address.
            - beneficiaryType: The type of beneficiary (e.g., Adult, Family, Kid, Widow).
            - address: The full address of the beneficiary. Look for "Address" or "Patient location" or similar labels and combine lines.
            - occupation: The beneficiary's occupation.
            - aadhaarNumber: The beneficiary's Aadhaar card number (usually a 12-digit number).
            - panNumber: The beneficiary's PAN card number (usually a 10-character alphanumeric string).
            - bankAccountName: The name on the bank account.
            - bankAccountNumber: The bank account number.
            - bankIfscCode: The bank IFSC code.
            - upiIds: A comma-separated string of UPI IDs.

            - referralName: The full name of the person who referred the case.
            - referralPhone: The phone number of the referral.
            
            Raw Text to Parse:
            ---
            ${input.rawText}
            ---
            `,
        output: {
            schema: ExtractLeadDetailsOutputSchema
        }
    });
    
    const output = llmResponse.output;

    if (!output) {
      throw new Error("The AI model did not return any output from the text.");
    }

    return output;
  }
);
