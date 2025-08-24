
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
            { text: `You are an expert data entry assistant. Analyze the provided block of text, which contains details for a new help request (lead). Your task is to carefully extract the following details. Be precise. If a field is not present in the text, omit it entirely from the output.

            **Fields to Extract:**
            - beneficiaryName: The full name of the person needing help.
            - beneficiaryPhone: The 10-digit phone number of the beneficiary.
            - amount: The numeric value of the amount requested.
            - purpose: The primary purpose of the request (e.g., Education, Medical, Relief Fund).
            - category: A more specific category if provided (e.g., School Fees, Ration Kit).
            - caseDetails: The detailed story or reason for the request. Capture the full narrative.
            - headline: A short, one-sentence summary of the case.
            
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
