import { ai } from '../genkit';
import { z } from 'zod';

export interface LocationResult {
  exactLocationName: string;
  coordinates?: { lat: number; lng: number };
}

export const extractLocationFromText = async ({ text }: { text: string }): Promise<LocationResult> => {
  console.log(`[Gemini] Extracting location from: "${text}"`);
  
  let searchQuery = '';
  let exactLocationName = 'Unknown';
  let fallbackCoordinates: { lat: number; lng: number } | null = null;

  try {
    const response = await ai.generate({
      prompt: `Extract the specific location from this incident report for geocoding.
        Assume the incident is in or near New Delhi, India (specifically Bharat Mandapam/Pragati Maidan) unless otherwise specified.

        Text: "${text}"
        
        Output JSON only:
        {
          "exactLocationName": "Gate 6, Bharat Mandapam",
          "searchQuery": "string",
          "fallbackCoordinates": { "lat": number, "lng": number }
        }
        
        IMPORTANT:
        1. "searchQuery" should be ONLY a broad valid mapping address (Landmark, Road, City, State, Country).
        2. DO NOT include the incident type.
        3. CRITICAL: Map APIs fail on highly specific sub-locations (like "Gate 6" or "Shop 12"). If the text mentions "Gate 6, Bharat Mandapam", your "searchQuery" MUST simply be "Bharat Mandapam, New Delhi, India".
        4. "fallbackCoordinates" MUST be your best estimated actual coordinates for the general area if mapping still fails.
        5. "exactLocationName" MUST be the exact name of the place mentioned in the text. If completely unknown, write "Unknown". Do NOT write generic terms like "specific place" or "landmark".`,
      output: {
        format: 'json',
        schema: z.object({
          exactLocationName: z.string(),
          searchQuery: z.string(),
          fallbackCoordinates: z.object({ lat: z.number(), lng: z.number() })
        })
      }
    });

    if (!response || !response.output) {
      throw new Error('No response from AI');
    }

    searchQuery = response.output.searchQuery;
    exactLocationName = response.output.exactLocationName;
    fallbackCoordinates = response.output.fallbackCoordinates;
    console.log(`[Geocoding] Searching API for: "${searchQuery}"`);

    // 1. Try Google Maps Geocoding API (Most Accurate)
    const googleToken = process.env.GOOGLE_MAPS_API_KEY;
    if (googleToken && googleToken !== 'YOUR_GOOGLE_MAPS_KEY_HERE') {
      console.log(`[Geocoding] Using Google Maps API`);
      const gRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${googleToken}`);
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.results && gData.results.length > 0) {
          const loc = gData.results[0].geometry.location;
          return { exactLocationName, coordinates: { lat: loc.lat, lng: loc.lng } };
        }
      }
    }

    // 2. Try Mapbox API if token is set
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (mapboxToken && mapboxToken !== 'YOUR_MAPBOX_TOKEN_HERE') {
      const mbRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&limit=1`);
      if (mbRes.ok) {
        const mbData = await mbRes.json();
        if (mbData.features && mbData.features.length > 0) {
          const [lng, lat] = mbData.features[0].center;
          return { exactLocationName, coordinates: { lat, lng } };
        }
      }
    }

    // 2. Fallback to Nominatim (OpenStreetMap) Geocoding
    const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'IncidentApp/1.0' }
    });
    
    if (nomRes.ok) {
      const nomData = await nomRes.json() as any[];
      if (nomData && nomData.length > 0) {
        return {
          exactLocationName,
          coordinates: { lat: parseFloat(nomData[0].lat), lng: parseFloat(nomData[0].lon) }
        };
      }
    }

    throw new Error('Geocoding APIs returned no results');

  } catch (error) {
    console.error('[Gemini/Geocoding] Location extraction failed:', error);
    return {
      exactLocationName: exactLocationName || 'Unknown',
      coordinates: fallbackCoordinates || { lat: 28.6146036, lng: 77.2427672 } // Bharat Mandapam fallback
    };
  }
};

export const getCoordinates = async (text: string) => {
  const result = await extractLocationFromText({ text });
  return {
    location: result.exactLocationName || 'Unknown',
    coordinates: result.coordinates || { lat: 28.6139, lng: 77.2090 }
  };
};

