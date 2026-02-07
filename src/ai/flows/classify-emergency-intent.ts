
import { ai } from '../genkit';
import { z } from 'zod';

export interface ClassificationResult {
  isEmergency: boolean;
  severity: 'critical' | 'severe' | 'moderate' | 'minor' | 'low';
  reason: string;
}

export const classifyEmergencyIntent = async ({ text }: { text: string }): Promise<ClassificationResult> => {
  console.log(`[Gemini] Classifying intent for: "${text}"`);

  try {
    const response = await ai.generate({
      prompt: `Analyze this social media post for emergency incident detection.
      
      Post: "${text}"
      
      Determine if this is a REAL-TIME witness report of an emergency (fire, accident, flood, building collapse, traffic jam).
      Ignore: News reports, general discussions, past events, politicial commentary.
      
      Output JSON only:
      {
        "isEmergency": boolean,
        "severity": "critical" | "severe" | "moderate" | "minor" | "low",
        "reason": "short explanation"
      }`,
      output: {
        format: 'json',
        schema: z.object({
          isEmergency: z.boolean(),
          severity: z.enum(['critical', 'severe', 'moderate', 'minor', 'low']),
          reason: z.string(),
        })
      }
    });

    if (!response || !response.output) {
      throw new Error('No response from AI');
    }

    return response.output;

  } catch (error) {
    console.error('[Gemini] Classification failed:', error);
    // Fallback to safe default
    return { isEmergency: false, severity: 'low', reason: 'AI Classification Failed' };
  }
};
