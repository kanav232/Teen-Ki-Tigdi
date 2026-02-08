
import { ai } from '../genkit';
import { z } from 'zod';

export const checkSimilarity = async (newReport: string, existingSummary: string): Promise<boolean> => {
    try {
        const response = await ai.generate({
            prompt: `
        You are an expert emergency dispatcher. 
        Compare these two incident reports and decide if they describe the EXACT SAME specific event/incident at the same time and place.

        Report A (Existing Summary): "${existingSummary}"
        Report B (New Incoming Text): "${newReport}"

        Rules:
        - If they describe the same event (e.g. same fire, same accident, same protest), return TRUE.
        - If they describe different events or different locations, return FALSE.
        - Be conservative: if unsure, return FALSE.

        Return only a JSON object: { "isSameEvent": boolean }
      `,
            output: {
                schema: z.object({
                    isSameEvent: z.boolean()
                })
            }
        });

        return response.output?.isSameEvent || false;
    } catch (error) {
        console.error('[AI] Similarity check failed:', error);
        return false; // Default to false if AI fails
    }
};
