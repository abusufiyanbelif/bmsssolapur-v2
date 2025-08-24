
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
        prompt: [
            { text: `You are an expert data entry assistant for a charity organization. Analyze the provided block of text, which contains details for a new help request (lead). Your task is to carefully extract the following details. Be precise. If a field is not present in the text, omit it entirely from the output.

            **Fields to Extract:**
            - headline: A short, one-sentence summary of the case.
            - purpose: The primary purpose (e.g., Education, Medical, Relief Fund, Deen, Loan, Other).
            - category: A more specific category if provided (e.g., School Fees, Ration Kit, Hospital Bill).
            - amount: The numeric value of the amount requested.
            - dueDate: The deadline for funds (Format: YYYY-MM-DD).
            - acceptableDonationTypes: An array of allowed donation types (e.g., ["Zakat", "Sadaqah"]).
            - caseDetails: The detailed story or reason for the request. Capture the full narrative.
            
            - beneficiaryName: The full name of the person needing help.
            - fatherName: The beneficiary's father's name.
            - beneficiaryType: The type of beneficiary (e.g., Adult, Family, Kid, Widow).
            - beneficiaryPhone: The 10-digit phone number of the beneficiary.
            - beneficiaryEmail: The beneficiary's email address.
            - address: The full address of the beneficiary.
            - occupation: The beneficiary's occupation.
            - aadhaarNumber: The beneficiary's Aadhaar card number.
            - panNumber: The beneficiary's PAN card number.
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
            ` },
        ],
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
