
'use server';
/**
 * @fileOverview A Genkit flow for extracting raw text from an image.
 * 
 * - extractRawTextFlow - A function that performs OCR on an image.
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
    
    const llmResponse = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: [
            { text: `You are an Optical Character Recognition (OCR) tool. You will be given one or more images. Extract all text from each image exactly as you see it. Maintain the original line breaks and formatting as best as possible. Do not summarize, analyze, or reformat the text. Just extract it. If there are multiple documents, separate the text from each one with '---'.` },
            ...mediaParts
        ],
        output: {
            schema: ExtractRawTextOutputSchema
        }
    });
    
    const output = llmResponse.output;

    if (!output?.rawText) {
      throw new Error("The AI model did not return any text. The image might be unreadable or contain no text.");
    }
    
    return output;
  }
);
