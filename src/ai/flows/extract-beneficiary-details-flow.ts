
'use server';
/**
 * @fileOverview A Genkit flow for extracting structured beneficiary details from text.
 * 
 * - extractBeneficiaryDetails - a function that performs data extraction from text.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    ExtractBeneficiaryDetailsFromTextInputSchema,
    ExtractBeneficiaryDetailsFromTextInput,
    ExtractBeneficiaryDetailsOutputSchema,
    ExtractBeneficiaryDetailsOutput,
} from '@/ai/schemas';

export async function extractBeneficiaryDetails(input: ExtractBeneficiaryDetailsFromTextInput): Promise<ExtractBeneficiaryDetailsOutput> {
  return extractBeneficiaryDetailsFromTextFlow(input);
}


const extractBeneficiaryDetailsFromTextFlow = ai.defineFlow(
  {
    name: 'extractBeneficiaryDetailsFromTextFlow',
    inputSchema: ExtractBeneficiaryDetailsFromTextInputSchema,
    outputSchema: ExtractBeneficiaryDetailsOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: `You are an expert data entry assistant specializing in parsing Aadhaar cards. Analyze the provided block of text, which was extracted via OCR from an Aadhaar card. Your task is to carefully extract the following beneficiary details. Be precise. If you cannot find a valid value for a field, omit the field entirely from the output.

            **--- AADHAAR CARD PARSING RULES ---**
            
            1.  **Full Name**: Carefully find the beneficiary's full name. It is usually labeled clearly under the "Government of India" heading.
            2.  **Name Parsing Logic**: A full name might have 2 or 3 parts. The first word is always 'beneficiaryFirstName'. The last word is always 'beneficiaryLastName'. If there is a middle word, it is the 'beneficiaryMiddleName'. For example, for "Rayan Feroz Shaikh", First Name is "Rayan", Middle Name is "Feroz", and Last Name is "Shaikh".
            3.  **Father's Name Logic**: 
                - **Step 1:** First, try to find an explicit father's name by looking for labels like "S/O", "Son of", or "C/O" (Care of) and extracting the name that follows.
                - **Step 2:** If and ONLY IF no such label is found, and the beneficiary's name has three parts (first, middle, last), then you can assume the middle name is the father's name. Use the middle name as the value for the 'fatherName' field in this case.
            4.  **Date of Birth & Gender**: Extract the Date of Birth (in DD/MM/YYYY format) from the "DOB" or "Date of Birth" or "जन्म तारीख" label. Extract Gender ("Male" or "Female") from the "Gender" or "पुरुष / MALE" label.
            5.  **Address Extraction**: Look for the specific label "Address:" or "पत्ता:". Capture all text and lines that follow it, including any "S/O" or "C/O" lines, until you reach the Aadhaar number (the 12-digit number). Combine these lines into a single, comma-separated string for the 'address' field.
            6.  **Address Components**: From the full address text, identify and extract the City, State, and PIN Code. The PIN Code is a 6-digit number.
            7.  **Phone Number**: Look for a 10-digit number labeled "Mobile" or "Phone". This is CRITICAL.
            8.  **Aadhaar Number**: Look for a 12-digit number, often grouped in sets of 4 (e.g., 1234 5678 9012). This is often labeled with "Your Aadhaar No." or "आपला आधार क्रमांक". You MUST find this number and map it to the 'aadhaarNumber' field.

            **--- FIELDS TO EXTRACT (Populate as many as possible) ---**
            
            - beneficiaryFirstName: The beneficiary's first name.
            - beneficiaryMiddleName: The beneficiary's middle name, if present.
            - beneficiaryLastName: The beneficiary's last name.
            - fatherName: The beneficiary's father's name. Use the two-step logic described above.
            - dateOfBirth: The beneficiary's date of birth (Format: DD/MM/YYYY).
            - gender: The beneficiary's gender ("Male" or "Female").
            - beneficiaryPhone: The 10-digit phone number of the beneficiary. Look for "Mobile", "Phone", or similar labels.
            - beneficiaryEmail: The beneficiary's email address. Must be a valid email format.
            - address: The full address of the beneficiary. Look for "Address" or "Patient location" or similar labels and combine lines.
            - city: The city from the address.
            - state: The state from the address (e.g., Maharashtra).
            - pincode: The 6-digit pincode from the address.
            - country: The country from the address. Default to 'India' if not specified.
            - aadhaarNumber: The beneficiary's Aadhaar card number (usually a 12-digit number).
            
            Raw Text to Parse:
            ---
            ${input.rawText}
            ---
            `,
        output: {
            schema: ExtractBeneficiaryDetailsOutputSchema
        }
    });
    
    const output = llmResponse.output;

    if (!output) {
      throw new Error("The AI model did not return any output from the text.");
    }

    return output;
  }
);
