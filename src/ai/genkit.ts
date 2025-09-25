
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// IMPORTANT: Do NOT import any flows into this file.
// This file is for initializing the 'ai' object only.
// All flow imports should be in 'src/ai/dev.ts'.

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.warn(
    'GEMINI_API_KEY environment variable not set. Genkit AI flows will not work.'
    );
}

const plugins = [googleAI({apiKey: geminiApiKey})];

export const ai = genkit({
  plugins,
});
