
import {genkit, type GenkitPlugin} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {isConfigValid} from '@/services/firebase';

const plugins: GenkitPlugin[] = [googleAI()];
// The firebase() plugin is only needed for Genkit features like Flow an a specific schedule,
// or in response to events from services like Firebase Authentication, Cloud Firestore, and Cloud Storage.
// Since we are not using those features, we can remove it to avoid configuration issues.
// if (isConfigValid) {
//   plugins.push(firebase());
// }

export const ai = genkit({
  plugins,
});
