
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
        prompt: `You are an expert data entry assistant for a charity organization. Analyze the provided block of text, which may come from various documents like ID cards, medical bills, or handwritten notes. Your task is to carefully extract the following details. Be precise. If you cannot find a valid value for a field, you MUST omit the field entirely from the output. Do not output fields with "null" or "N/A" as their value.

            **Key Instructions:**
            1.  **Generate a Compelling Story**: Based on all the text, synthesize a detailed narrative for the 'story' field. This should be suitable for a public audience to understand the beneficiary's situation and need for help. Use the "Comment" or "Impression" section of medical reports for this.
            2.  **Identify Medical Conditions**: If the text is from a medical report (like Apollo Diagnostics), identify the specific disease, diagnosis, or abnormal test results (e.g., high ESR indicates inflammation). Use this information to set the 'purpose' to "Medical" and populate the 'diseaseIdentified' field.
            3.  **Extract Beneficiary Details from Aadhaar Card**: 
                - Carefully find the beneficiary's full name. Look for labels like "Patient Name", "Name". Remove any titles like "MR.". 
                - **Name Parsing Logic**: A full name might have 2, 3, or 4 parts. The first word is always 'beneficiaryFirstName'. The last word is always 'beneficiaryLastName'. Any words in between constitute the 'beneficiaryMiddleName'. For example, for "Abusufiyan Zulfiquar Ali Ahmed Belief", First Name is "Abusufiyan", Last Name is "Belief", and Middle Name is "Zulfiquar Ali Ahmed".
                - **Address Extraction:** Look for the specific label "Address:". Capture all text and lines that follow it, including any "S/O" (Son of) lines, until you reach the Aadhaar number (the 12-digit number). Combine these lines into a single, comma-separated string for the 'address' field.
            4.  **Extract Father's Name**: Look for labels like "S/O", "Son of", or "Father's Name" to find the father's name.
            5.  **Date of Birth and Gender**: Extract the Date of Birth (in DD/MM/YYYY format) and Gender ("Male" or "Female") from the Aadhaar card.

            **Fields to Extract:**
            - headline: A short, one-sentence summary of the case. If not explicit, create one from the story. For a medical report, it could be "Assistance needed for medical tests and treatment."
            - story: A detailed narrative of the beneficiary's situation, suitable for public display. Synthesize this from all available information in the text. If a medical condition is present, describe it clearly in the story.
            - diseaseIdentified: If a medical report, extract the specific disease or diagnosis mentioned (e.g., "Typhoid Fever", "Osteoarthritis").
            - purpose: The primary purpose (e.g., Education, Medical, Relief Fund, Deen, Loan, Other). Infer "Medical" from lab reports or bills.
            - category: A more specific category if provided (e.g., School Fees, Ration Kit, Hospital Bill, Diagnostic Tests).
            - amount: The numeric value of the amount requested.
            - dueDate: The deadline for funds (Format: YYYY-MM-DD).
            - acceptableDonationTypes: An array of allowed donation types (e.g., ["Zakat", "Sadaqah"]).
            - caseDetails: The detailed story or reason for the request. Capture the full narrative for internal review.
            
            - beneficiaryFirstName: The beneficiary's first name.
            - beneficiaryMiddleName: The beneficiary's middle name, if present.
            - beneficiaryLastName: The beneficiary's last name.
            - fatherName: The beneficiary's father's name. Look for "S/O", "Son of", or "Father's Name".
            - dateOfBirth: The beneficiary's date of birth (Format: YYYY-MM-DD).
            - gender: The beneficiary's gender ("Male" or "Female").
            - beneficiaryPhone: The 10-digit phone number of the beneficiary. Look for "Mobile", "Phone", or similar labels.
            - beneficiaryEmail: The beneficiary's email address. Must be a valid email format.
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
