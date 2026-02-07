
// Verification script for AI flows
import 'dotenv/config';
import { classifyEmergencyIntent } from '../src/ai/flows/classify-emergency-intent';
import { extractLocationFromText } from '../src/ai/flows/extract-location-from-text';

async function runTests() {
    const testCases = [
        "Huge fire near Karol Bagh metro station, smoke everywhere!",
        "Stuck in traffic at ITO for 2 hours.",
        "Just saw a movie, it was great.", // Non-emergency
        "Building collapse reported in Laxmi Nagar 5 mins ago."
    ];

    console.log("=== STARTING AI VERIFICATION ===\n");

    for (const text of testCases) {
        console.log(`\n--- Testing: "${text}" ---`);

        try {
            console.log("1. Classifying Intent...");
            const intent = await classifyEmergencyIntent({ text });
            console.log("Intent Result:", JSON.stringify(intent, null, 2));

            if (intent.isEmergency) {
                console.log("2. Extracting Location...");
                const location = await extractLocationFromText({ text });
                console.log("Location Result:", JSON.stringify(location, null, 2));
            } else {
                console.log("Skipping location extraction (Not an emergency)");
            }

        } catch (error) {
            console.error("Error processing test case:", error);
        }
    }

    console.log("\n=== VERIFICATION COMPLETE ===");
}

runTests().catch(console.error);
