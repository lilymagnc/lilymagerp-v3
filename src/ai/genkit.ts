
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase/plugin';

export const ai = genkit({
  plugins: [
    firebase(),
    googleAI()
  ],
  model: 'googleai/gemini-1.5-flash-latest',
});
