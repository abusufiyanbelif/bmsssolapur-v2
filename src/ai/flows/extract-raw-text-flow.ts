
'use server';
/**
 * @fileOverview A Genkit flow for extracting raw text from an image.
 * 
 * - extractRawText - A function that performs OCR on an image.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ExtractRawTextInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractRawTextInput = z.infer<typeof ExtractRawTextInputSchema>;

export const ExtractRawTextOutputSchema = z.object({
    rawText: z.string().describe("The full, raw text extracted from the image.")
});
export type ExtractRawTextOutput = z.infer<typeof ExtractRawTextOutputSchema>;


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
        prompt: await prompt.render({input}),
    });
    
    const output = llmResponse.output();

    if (!output?.rawText) {
      throw new Error("The AI model did not return any text. The image might be unreadable or contain no text.");
    }
    
    return output;
  }
);
