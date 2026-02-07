import { ai } from '../genkit';
import { z } from 'zod';

export interface LocationResult {
  locationReferences: string[];
  coordinates?: { lat: number; lng: number };
}

export const extractLocationFromText = async ({ text }: { text: string }): Promise<LocationResult> => {
  console.log(`[Gemini] Extracting location from: "${text}"`);

  try {
    const response = await ai.generate({
      prompt: `Extract the specific location from this incident report.
        
        Text: "${text}"
        
        Output JSON only:
        {
          "locationReferences": ["specific place", "landmark", "area", "city"],
          "coordinates": { "lat": number, "lng": number }
        }
        
        IMPORTANT:
        1. Try to be as specific as possible (Street > Area > City).
        2. ESTIMATE valid GPS coordinates for the most specific location found (e.g., if it says "Connaught Place", return CP coordinates).`,
      output: {
        format: 'json',
        schema: z.object({
          locationReferences: z.array(z.string()),
          coordinates: z.object({
            lat: z.number(),
            lng: z.number()
          }).optional()
        })
      }
    });

    if (!response || !response.output) {
      throw new Error('No response from AI');
    }

    return response.output;

  } catch (error) {
    console.error('[Gemini] Location extraction failed:', error);
    // Fallback
    return { locationReferences: ['Unknown Location'], coordinates: { lat: 28.6139, lng: 77.2090 } };
  }
};

export const getCoordinates = async (text: string) => {
  const result = await extractLocationFromText({ text });
  return {
    location: result.locationReferences[0] || 'Unknown Location',
    coordinates: result.coordinates || { lat: 28.6139, lng: 77.2090 }
  };
};

