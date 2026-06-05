import { genkit } from 'genkit';
import { openAICompatible } from '@genkit-ai/compat-oai';

const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('[Genkit] ⚠️ No API key found in GROQ_API_KEY or OPENAI_API_KEY.');
} else {
  console.log('[Genkit] ✅ Loaded API key.');
}

export const ai = genkit({
  plugins: [
    openAICompatible({
      name: 'groq',
      apiKey: apiKey,
      baseURL: 'https://api.groq.com/openai/v1'
    })
  ],
  model: 'groq/llama-3.1-8b-instant',
});
