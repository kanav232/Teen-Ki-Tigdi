
import 'dotenv/config';
import { processIncidentReport } from '../src/services/incident-service';

// MOCK the AI for this simulation script to avoid gRPC/Env issues in standalone mode
import * as aiFlows from '../src/ai/flows/extract-location-from-text';
// @ts-ignore
aiFlows.getCoordinates = async (text: string) => {
    console.log('[MockAI] Simulating successful location extraction for:', text);
    return {
        location: 'Ashoka University',
        coordinates: { lat: 28.9460, lng: 77.1000 }
    };
};

async function simulate() {
    console.log('--- SIMULATING BLUESKY DETECTION ---');
    console.log('GOOGLE_GENAI_API_KEY:', process.env.GOOGLE_GENAI_API_KEY ? 'Set' : 'Missing');
    console.log('Injecting a mock post that matches all strict criteria...');

    const mockPost = {
        text: "Serious fire reported near Ashoka University main gate. Flames are visible. #Emergency",
        sourceType: 'bluesky' as const,
        authorId: 'simulation_user.bsky.social',
        authorType: 'unverified' as const
    };

    console.log(`\n[SIMULATION] Incoming Post: "${mockPost.text}"`);

    // This calls the exact same function the Poller calls
    const result = await processIncidentReport(mockPost);

    console.log('\n--- RESULT ---');
    console.log(JSON.stringify(result, null, 2));

    if (result && result.status === 'created') {
        console.log('\n✅ SUCCESS: Incident created in Firebase!');
        console.log('Check your Map or Firebase Console for a new "Fire" incident at Ashoka University.');
    } else {
        console.log('\n❌ FAILED: The strict filters rejected this post.');
    }
}

simulate();
