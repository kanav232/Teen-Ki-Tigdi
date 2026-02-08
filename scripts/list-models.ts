import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import 'dotenv/config';

const ai = genkit({
    plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
});

async function listAllModels() {
    console.log("Listing available models from Genkit registry...");
    const actions = await ai.listActions();
    const models = actions.filter(a => a.name.startsWith('googleai')).map(a => a.name);
    console.log(JSON.stringify(models, null, 2));
}

listAllModels().catch(console.error);
