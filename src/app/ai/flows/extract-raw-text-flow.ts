
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


export const extractRawTextFlow = ai.defineFlow(
  {
    name: 'extractRawTextFlow',
    inputSchema: ExtractRawTextInputSchema,
    outputSchema: ExtractRawTextOutputSchema,
  },
  async (input) => {
    
    const mediaParts = input.photoDataUris.map(uri => ({ media: { url: uri } }));
    
    // For vision tasks, gemini-pro-vision is often a good specific choice,
    // but the latest multimodal models can also handle it. We will use the standard fallback pattern.
    const modelCandidates = [
        googleAI.model('gemini-1.5-flash-latest'),
        googleAI.model('gemini-1.5-pro-latest'),
    ];
    
    let lastError: any;

    for (const model of modelCandidates) {
        try {
            console.log(`🔄 Trying ${model.name} for extractRawText...`);
            const llmResponse = await ai.generate({
                model: model,
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
            console.log(`✅ Success with ${model.name}`);
            return output; // Success
        } catch (err) {
            lastError = err;
            console.error(`❌ Error with ${model.name} for extractRawText:`, err instanceof Error ? err.message : String(err));
        }
    }
    
    console.error("All models failed for extractRawText.", lastError);
    throw new Error(`All models failed. Last error: ${lastError?.message}`);
  }
);
