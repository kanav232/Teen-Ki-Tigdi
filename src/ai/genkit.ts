import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const keyVars = [
  'GOOGLE_GENAI_API_KEY',
  'GOOGLE_GENAI_API_KEY_2',
  'GOOGLE_GENAI_API_KEY_3',
  'GOOGLE_GENAI_API_KEY_4',
  'GOOGLE_GENAI_API_KEY_5'
];

const keys = keyVars
  .map(v => ({ name: v, val: process.env[v] }))
  .filter(k => !!k.val && k.val.trim().length > 0)
  .map(k => k.val!.trim());

if (keys.length === 0) {
  console.warn('[Genkit] ⚠️ No API keys found in GOOGLE_GENAI_API_KEY through GOOGLE_GENAI_API_KEY_5.');
} else {
  console.log(`[Genkit] ✅ Loaded ${keys.length} API keys for rotation.`);
}

const instances = keys.map(key => genkit({
  plugins: [googleAI({ apiKey: key })],
  model: 'googleai/gemini-2.0-flash-lite',
}));

let currentIndex = 0;

/**
 * Proxy object that rotates between multiple Genkit instances (API Keys)
 * to bypass rate limits.
 */
export const ai = new Proxy({} as any, {
  get(_, prop) {
    if (instances.length === 0) return undefined;

    const instance = instances[currentIndex];
    const value = (instance as any)[prop];

    if (prop === 'generate' || prop === 'run' || prop === 'defineFlow') {
      return async (...args: any[]) => {
        let attempts = 0;
        const maxAttempts = instances.length;

        while (attempts < maxAttempts) {
          // Pick current instance and rotate for the next call
          const instance = instances[currentIndex];
          const innerValue = (instance as any)[prop];

          currentIndex = (currentIndex + 1) % instances.length;
          console.log(`\x1b[1m[Genkit] Using Key ${currentIndex === 0 ? instances.length : currentIndex}/${instances.length}\x1b[0m for ${String(prop)} (Attempt ${attempts + 1})`);

          try {
            // Silencing internal plugin errors if possible (they often log to console.error)
            const originalConsoleError = console.error;
            let capturedErrorOutput = '';
            console.error = (...args: any[]) => {
              if (args[0]?.toString().includes('429')) {
                capturedErrorOutput = args[0];
                return; // Suppress
              }
              originalConsoleError(...args);
            };

            try {
              const result = await (innerValue as Function).apply(instance, args);
              console.error = originalConsoleError; // Restore

              // User requested 5s delay after each successful call
              console.log('[Genkit] Call successful. Waiting 5s micro-delay...');
              await new Promise(resolve => setTimeout(resolve, 5000));

              return result;
            } catch (err) {
              console.error = originalConsoleError; // Restore
              throw err;
            }
          } catch (error: any) {
            if (error.message?.includes('429')) {
              console.error(`\x1b[31m[Genkit] Error 429: Too many requests (Key ${currentIndex === 0 ? instances.length : currentIndex})\x1b[0m`);
              attempts++;
              if (attempts >= maxAttempts) {
                console.error('\x1b[31m[Genkit] ALL KEYS EXHAUSTED (429)\x1b[0m');
                throw new Error('429 Too Many Requests (All keys exhausted)');
              }
              // continue loop to next key
            } else {
              console.error(`[Genkit] ${String(prop)} failed:`, error.message || error);
              throw error;
            }
          }
        }
      };
    }

    return typeof value === 'function' ? value.bind(instance) : value;
  }
});
