
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
        prompt: `You are an expert data entry assistant specializing in Indian identity documents like the Aadhaar card. Your task is to analyze the provided OCR text and extract the information into the dedicated fields defined in the output schema. Follow these rules precisely.

            **--- EXTRACTION RULES ---**

            1.  **Full Name:** Carefully find the beneficiary's full name. It is usually the first prominent name on the card.
                - From this full name, parse the 'beneficiaryFirstName', 'beneficiaryMiddleName', and 'beneficiaryLastName'. The first word is the first name, the last word is the last name, and anything in between is the middle name.

            2.  **Father's Name:** Look for a name immediately following the labels "S/O" or "C/O". This is the father's name. If no such label is found, and the beneficiary's name has three parts, you can infer that the middle name is the father's name.

            3.  **Date of Birth:** Find the date next to the label "DOB" or "जन्म तारीख".

            4.  **Gender:** Find the gender next to the label "Gender" or "पुरुष / MALE".

            5.  **Phone Number:** Find the 10-digit mobile number, which may or may not have a label.

            6.  **Aadhaar Number:** This is critical. Look for a 12-digit number, which is often grouped in sets of four (e.g., 1234 5678 9012). It will be next to one of these labels: "Your Aadhaar No.", "आपला आधार क्रमांक", or "आधार क्रमांक". You MUST find this number.

            7.  **Address Block:** First, find the specific label **"Address:"** or **"पत्ता:"**. Capture all text and lines that follow it, until you reach the text containing the Aadhaar number or the end of the document. This complete text is the value for the 'address' field.
            
            8.  **Address Components:** From the full address block you just extracted, identify and populate the following dedicated fields:
                -   `city`: The city name (e.g., Solapur).
                -   `state`: The state name (e.g., Maharashtra).
                -   `pincode`: The 6-digit PIN code.
                -   `country`: The country. If not specified, assume "India".

            If you cannot find a valid value for a field, you MUST omit the field entirely from your JSON output.

            ---
            **OCR Text to Analyze:**
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

