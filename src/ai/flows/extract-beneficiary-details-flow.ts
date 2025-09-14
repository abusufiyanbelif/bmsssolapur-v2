
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
        prompt: `You are an expert in document analysis and data extraction, specializing in Indian identity documents like the Aadhaar card.

Your task is to analyze the provided OCR text from a document and extract the information into the dedicated fields defined in the output schema.

- If a person's full name is present, extract their first, middle, and last names into the 'beneficiaryFirstName', 'beneficiaryMiddleName', and 'beneficiaryLastName' fields.
- If an address is present (often labeled with 'Address:' or 'पत्ता:'), extract the full address. From that full address, also extract the 'city', 'state', 'country', and 'pincode' into their dedicated fields.
- For other fields, identify the labels and their corresponding values.

**CRITICAL HINTS FOR ACCURACY:**
- **Aadhaar Number:** This is the most important field. It is a 12-digit number, often grouped in sets of four (e.g., 1234 5678 9012). It is typically labeled with "Your Aadhaar No.", "आधार क्रमांक", or "आपला आधार क्रमांक". You MUST find this number.
- **Father's Name:** Look for a name associated with "S/O" or "C/O". If not found, you can infer it from the middle name of a three-part beneficiary name.
- **Date of Birth:** Often labeled as "DOB" or "जन्म तारीख".
- **Phone Number:** Look for a 10-digit mobile number.

Return the extracted data. If a value for a field is not found in the document, omit the field from your response.

Here is the OCR text from the document:
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
