
import {genkit, type GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';
import {isConfigValid} from '@/services/firebase';

const plugins: GenkitPlugin[] = [googleAI()];
if (isConfigValid) {
  plugins.push(firebase());
}

export const ai = genkit({
  plugins,
});
