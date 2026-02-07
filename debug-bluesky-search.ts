
import { blueskyClient } from './src/lib/bluesky-client';
import 'dotenv/config';

async function runDebug() {
    console.log('--- Debugging Bluesky Search ---');
    await blueskyClient.login();

    const queries = [
        'pothole', // Simple keyword
        'Ashoka',  // Required keyword
        'pothole Ashoka', // AND combination
        '"huge pothole"', // Exact phrase from post
        'from:kanav06.bsky.social', // Targeted author search
        '("pothole" OR "potholes") "Ashoka"' // Complex query subset
    ];

    for (const q of queries) {
        console.log(`\nTesting Query: [ ${q} ]`);
        try {
            const posts = await blueskyClient.searchPosts(q);
            console.log(`Found ${posts.length} posts.`);
            if (posts.length > 0) {
                console.log(`Top result: ${posts[0].record.text.substring(0, 50)}...`);
                console.log(`Author: ${posts[0].author.handle}`);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

runDebug();
