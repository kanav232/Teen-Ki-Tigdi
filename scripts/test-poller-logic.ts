
// Test script for keyword threshold logic
import { INCIDENT_KEYWORDS, KEYWORD_MATCH_THRESHOLD } from '../src/config/incident-keywords';

function testPost(text: string) {
    const lowerText = text.toLowerCase();
    let matchCount = 0;
    const matchedKeywords: string[] = [];

    for (const keyword of INCIDENT_KEYWORDS) {
        if (lowerText.includes(keyword.toLowerCase())) {
            matchCount++;
            matchedKeywords.push(keyword);
        }
    }

    const passed = matchCount >= KEYWORD_MATCH_THRESHOLD;
    console.log(`\nText: "${text}"`);
    console.log(`Matches: ${matchCount} [${matchedKeywords.join(', ')}]`);
    console.log(`Result: ${passed ? 'ACCEPTED' : 'REJECTED'}`);
    return passed;
}

console.log(`\n=== TESTING THRESHOLD LOGIC (Threshold: ${KEYWORD_MATCH_THRESHOLD}) ===`);

// Test Case 1: Single keyword (Should Reject)
testPost("This movie is fire!");

// Test Case 2: Multi-keyword (Should Accept)
testPost("Huge fire reported, help needed immediately!");

// Test Case 3: Keyword + Context (Should Accept)
testPost("Stuck in traffic jam at ITO.");

// Test Case 4: No keywords (Should Reject)
testPost("Just hanging out today.");
