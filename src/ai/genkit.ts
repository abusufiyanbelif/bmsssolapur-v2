
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const plugins = [googleAI({
    apiKey: process.env.GEMINI_API_KEY,
})];

export const ai = genkit({
  plugins,
});
