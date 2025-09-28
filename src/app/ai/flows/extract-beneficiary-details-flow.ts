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
    
    const fieldsToFind = input.fieldsToFind && input.fieldsToFind.length > 0
        ? `Focus only on finding the following missing fields: ${input.fieldsToFind.join(', ')}.`
        : 'Your task is to analyze the provided OCR text and extract all relevant information into the specific fields defined in the output schema.';

    const modelCandidates = [
        googleAI.model('gemini-1.5-flash-latest'),
        googleAI.model('gemini-1.5-pro-latest'),
    ];
    let lastError: any;

    for (const model of modelCandidates) {
        try {
            console.log(`🔄 Trying ${model.name} for extractBeneficiaryDetails...`);
            const llmResponse = await ai.generate({
                model: model,
                prompt: `You are an expert in document analysis and data extraction, specializing in Indian identity documents. ${fieldsToFind}

                    **--- EXTRACTION RULES ---**

                    1.  **Full Name:** If a person's full name is present (e.g., "SHAIKH RAYAN FEROZ"), extract their first, middle, and last names into the dedicated fields. First name is the first word, last name is the last word, and anything in between is the middle name. Also return the full name as 'beneficiaryFullName'.

                    2.  **Address:** If an address is present, extract the full address as a single string. Also, identify and extract the country, state, city, and pincode into their dedicated fields. **If the country is not explicitly mentioned, assume it is 'India'.**

                    3.  **Labeled Data:** For other fields, identify the labels (keys) and their corresponding values. In many documents, a key and value are separated by a colon (:). For example, "DOB: 29/09/2006". Make sure to capture the value correctly.
                        - Look for "DOB" or "जन्म तारीख" to find the 'dateOfBirth'. **You MUST format this date as a full ISO 8601 string (YYYY-MM-DDTHH:mm:ss.sssZ).**
                        - Look for "Gender" or "पुरुष / MALE" or "মহিলা / FEMALE" to find the 'gender'.
                        - Look for a 10-digit mobile number for the 'beneficiaryPhone'.
                    
                    4.  **Aadhaar Number:** This is critical. Look for a 12-digit number, often grouped in sets of four (e.g., 2165 0014 1667). It is often labeled with "Your Aadhaar No." or "आपला आधार क्रमांक" or "आधार क्रमांक".

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
            console.log(`✅ Success with ${model.name}`);
            return output; // Success, return the result
        } catch (err) {
            lastError = err;
            console.error(`❌ Error with ${model.name} for extractBeneficiaryDetails:`, err instanceof Error ? err.message : String(err));
        }
    }
    
    // If all models failed, throw the last error
    console.error("All models failed for extractBeneficiaryDetails.", lastError);
    throw new Error(`All models failed. Last error: ${lastError?.message}`);
  }
);
