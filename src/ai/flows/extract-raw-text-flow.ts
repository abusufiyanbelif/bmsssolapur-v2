
'use server';
/**
 * @fileOverview A Genkit flow for extracting raw text from an image.
 * 
 * - extractRawText - A function that performs OCR on an image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import {
    ExtractRawTextInput,
    ExtractRawTextInputSchema,
    ExtractRawTextOutput,
    ExtractRawTextOutputSchema
} from '@/ai/schemas';


export async function extractRawText(input: ExtractRawTextInput): Promise<ExtractRawTextOutput> {
  return extractRawTextFlow(input);
}


const prompt = ai.definePrompt({
    name: 'rawTextExtractorPrompt',
    input: { schema: ExtractRawTextInputSchema },
    output: { schema: ExtractRawTextOutputSchema },
    prompt: `You are an Optical Character Recognition (OCR) tool. Extract all text from the provided image exactly as you see it. Maintain the original line breaks and formatting as best as possible. Do not summarize, analyze, or reformat the text. Just extract it.

    Image: {{media url=photoDataUri}}`
});


const extractRawTextFlow = ai.defineFlow(
  {
    name: 'extractRawTextFlow',
    inputSchema: ExtractRawTextInputSchema,
    outputSchema: ExtractRawTextOutputSchema,
  },
  async (input) => {
    
    const llmResponse = await ai.generate({
        model: googleAI.model('gemini-pro-vision'),
        prompt: prompt.prompt!, // Use the raw prompt string
        input: input, // Pass the structured input separately
    });
    
    const output = llmResponse.output();

    if (!output?.rawText) {
      throw new Error("The AI model did not return any text. The image might be unreadable or contain no text.");
    }
    
    return output;
  }
);
