import { genkit } from 'genkit';
import { openAICompatible } from '@genkit-ai/compat-oai';
import 'dotenv/config';

const ai = genkit({
    plugins: [
        openAICompatible({
            name: 'groq',
            apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1'
        })
    ],
});

async function listAllModels() {
    console.log("Listing available models from Genkit registry...");
    // @ts-ignore
    const actions = await ai.registry.listActions?.() || [];
    const models = actions.filter((a: any) => a.name.startsWith('groq')).map((a: any) => a.name);
    console.log(JSON.stringify(models, null, 2));
}

listAllModels().catch(console.error);
