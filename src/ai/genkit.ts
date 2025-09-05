
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

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
