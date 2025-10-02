'use server';
/**
 * @fileOverview A Genkit flow for extracting raw text from an image or PDF.
 * 
 * - extractRawTextFlow - A function that performs OCR on a document.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    ExtractRawTextInputSchema,
    ExtractRawTextOutput,
    ExtractRawTextOutputSchema
} from '@/ai/schemas';
import { getSafeGeminiModel } from '@/services/gemini-service';

export const extractRawTextFlow = ai.defineFlow(
  {
    name: 'extractRawTextFlow',
    inputSchema: ExtractRawTextInputSchema,
    outputSchema: ExtractRawTextOutputSchema,
  },
  async (input) => {
    
    const mediaParts = input.photoDataUris.map(uri => ({ media: { url: uri } }));
    
    // Use flash model for speed and cost-effectiveness in OCR tasks.
    const modelName = await getSafeGeminiModel('models/gemini-1.5-flash-latest');
    
    try {
        console.log(`🔄 Trying ${modelName} for extractRawText...`);
        const llmResponse = await ai.generate({
            model: googleAI.model(modelName),
            prompt: [
                { text: `You are an Optical Character Recognition (OCR) tool. You will be given one or more images or PDF documents (like medical reports, ID cards, or payment receipts). Extract all text from each document exactly as you see it. Maintain the original line breaks and formatting as best as possible. Do not summarize, analyze, or reformat the text. Just extract it. If there are multiple documents, separate the text from each one with '---'.` },
                ...mediaParts
            ],
            output: {
                schema: ExtractRawTextOutputSchema
            }
        });
        
        const output = llmResponse.output;

        if (!output?.rawText) {
          throw new Error("The AI model did not return any text. The document might be unreadable or contain no text.");
        }
        console.log(`✅ Success with ${modelName}`);
        return output; // Success
    } catch (err) {
        const lastError = err as Error;
        console.error(`❌ Error with ${modelName} for extractRawText:`, lastError.message);
        throw new Error(`Failed to extract text. Last error: ${lastError.message}`);
    }
  }
);
