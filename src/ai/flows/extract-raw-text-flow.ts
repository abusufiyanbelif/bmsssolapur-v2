
'use server';
/**
 * @fileOverview A Genkit flow for extracting raw text from an image.
 * 
 * - extractRawText - A function that performs OCR on an image.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    ExtractRawTextInput,
    ExtractRawTextInputSchema,
    ExtractRawTextOutput,
    ExtractRawTextOutputSchema
} from '@/ai/schemas';


export async function getRawTextFromImage(input: ExtractRawTextInput): Promise<ExtractRawTextOutput> {
  return extractRawText(input);
}


export async function extractRawText(input: ExtractRawTextInput): Promise<ExtractRawTextOutput> {
  return extractRawTextFlow(input);
}


const extractRawTextFlow = ai.defineFlow(
  {
    name: 'extractRawTextFlow',
    inputSchema: ExtractRawTextInputSchema,
    outputSchema: ExtractRawTextOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
        model: googleAI.model('gemini-1.5-flash-latest'),
        prompt: [
            { text: `You are an Optical Character Recognition (OCR) tool. Extract all text from the provided image exactly as you see it. Maintain the original line breaks and formatting as best as possible. Do not summarize, analyze, or reformat the text. Just extract it.` },
            { media: { url: input.photoDataUri } }
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
