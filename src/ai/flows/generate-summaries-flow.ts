
'use server';
/**
 * @fileOverview A Genkit flow for generating multiple case summary options from raw text.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    GenerateSummariesInputSchema,
    GenerateSummariesInput,
    GenerateSummariesOutputSchema,
    GenerateSummariesOutput,
} from '@/ai/schemas';

export async function generateSummaries(input: GenerateSummariesInput): Promise<GenerateSummariesOutput> {
  return generateSummariesFlow(input);
}


const generateSummariesFlow = ai.defineFlow(
  {
    name: 'generateSummariesFlow',
    inputSchema: GenerateSummariesInputSchema,
    outputSchema: GenerateSummariesOutputSchema,
  },
  async (input) => {
    
    const modelCandidates = [
        googleAI.model('gemini-1.5-flash'),
        googleAI.model('gemini-pro'),
    ];
    let lastError: any;
    
    for (const model of modelCandidates) {
        try {
            const llmResponse = await ai.generate({
                model: model,
                prompt: `You are an expert copywriter for a charity organization. You specialize in creating short, compelling case summaries to encourage donations.

                Analyze the provided block of text, which was extracted from a document like a medical report, bill, or application letter.
                
                Your task is to generate three distinct, one-sentence summaries of the case. Each summary should be concise, impactful, and suitable for public display.

                **Here is the raw text to analyze:**
                ---
                ${input.rawText}
                ---
                `,
                output: {
                    schema: GenerateSummariesOutputSchema
                }
            });
            
            const output = llmResponse.output;

            if (!output || !output.summaries || output.summaries.length === 0) {
              throw new Error("The AI model did not return any summary options.");
            }
            return output; // Success
        } catch (err) {
            lastError = err;
            console.warn(`Model ${model.name} failed for generateSummaries. Trying next model...`, err);
        }
    }
    
    console.error("All models failed for generateSummaries.", lastError);
    throw new Error(`All models failed. Last error: ${lastError?.message}`);
  }
);
