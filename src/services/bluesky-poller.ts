// A background service that polls Bluesky for emergency keywords
import { blueskyClient } from '../lib/bluesky-client';
import { processIncidentReport } from './incident-service';
import { INCIDENT_KEYWORDS, KEYWORD_MATCH_THRESHOLD, EXCLUDED_KEYWORDS, REQUIRED_KEYWORDS } from '../config/incident-keywords';

const POLL_INTERVAL_MS = 5000; // 5 seconds
const KEYWORDS = INCIDENT_KEYWORDS;

let isPolling = false;

export function startBlueskyPoller() {
    if (isPolling) return;
    isPolling = true;

    console.log('[BlueskyPoller] Starting background service...');

    // Initial login
    blueskyClient.login().catch(console.error);

    let currentBatchIndex = 0;
    const BATCH_SIZE = 10; // Bluesky query limit optimization

    let isProcessing = false;

    setInterval(async () => {
        if (isProcessing) {
            // Skip this interval if previous batch is still running
            return;
        }
        isProcessing = true;

        try {
            // Create a batch of keywords combined with OR
            const start = currentBatchIndex * BATCH_SIZE;
            const end = start + BATCH_SIZE;
            const batch = KEYWORDS.slice(start, end);

            if (batch.length === 0) {
                currentBatchIndex = 0; // Reset loop
                isProcessing = false;
                return;
            }



            // ... (inside startBlueskyPoller)

            // Construct OR query: "keyword1" OR "keyword2" ...
            // We use quotes for multi-word phrases to be exact
            const orQuery = batch.map(k => `"${k}"`).join(' OR ');

            // Append exclusions: -exclude1 -exclude2
            const exclusionQuery = EXCLUDED_KEYWORDS.map(k => `-${k}`).join(' ');

            // Append required keywords: "Required"
            const requiredQuery = REQUIRED_KEYWORDS.map(k => `"${k}"`).join(' AND ');

            const query = `(${orQuery}) ${requiredQuery} ${exclusionQuery}`;

            console.log(`[BlueskyPoller] Batch ${currentBatchIndex + 1} ran`);

            let posts = await blueskyClient.searchPosts(query);

            // OPTIMIZATION: Also fetch latest posts from specific test user to bypass search index latency
            try {
                // TODO: Make this list configurable or dynamic
                const authorPosts = await blueskyClient.getAuthorPosts('kanav06.bsky.social');
                if (authorPosts.length > 0) {
                    const existingUris = new Set(posts.map(p => p.uri));
                    const newPosts = authorPosts.filter(p => !existingUris.has(p.uri));
                    if (newPosts.length > 0) {
                        // console.log(`[BlueskyPoller] Added ${newPosts.length} posts from author feed.`);
                        posts = [...posts, ...newPosts];
                    }
                }
            } catch (err) {
                console.error('[BlueskyPoller] Failed to fetch author posts', err);
            }

            if (posts.length > 0) {
                // console.log(`[BlueskyPoller] Found ${posts.length} posts for batch.`);
            }

            for (const post of posts) {
                const text = post.record.text.toLowerCase();
                let matchCount = 0;
                const matchedKeywords: string[] = [];

                // Count how many keywords are present in the text (Global Check)
                // We check against ALL keywords (Incident + Required) to ensure strict filtering but allow required words to boost confidence
                const allKeywords = [...INCIDENT_KEYWORDS, ...REQUIRED_KEYWORDS];
                for (const keyword of allKeywords) {
                    if (text.includes(keyword.toLowerCase())) {
                        matchCount++;
                        matchedKeywords.push(keyword);
                    }
                }

                if (matchCount < KEYWORD_MATCH_THRESHOLD) {
                    // Debug log only for failures to catch near-misses? Or too noisy?
                    // console.log(`[BlueskyPoller] Skipped post (Limit ${matchCount}/${KEYWORD_MATCH_THRESHOLD})`);
                    continue;
                }

                console.log(`[BlueskyPoller] Processing Post (Matches: ${matchCount} [${matchedKeywords.join(', ')}]): "${post.record.text.substring(0, 30)}..."`);

                // Construct Post URL (https://bsky.app/profile/<handle>/post/<rkey>)
                const rkey = post.uri.split('/').pop();
                const postUrl = `https://bsky.app/profile/${post.author.handle}/post/${rkey}`;

                try {
                    const result = await processIncidentReport({
                        text: post.record.text,
                        sourceType: 'bluesky',
                        authorId: post.author.handle,
                        authorType: post.author.handle.includes('verified') || post.author.displayName?.includes('Safety') ? 'verified' : 'unverified',
                        postUri: post.uri, // Pass URI for deduplication
                        postUrl: postUrl // Pass URL for display
                        // evidence: { image: get first image if any }
                    });

                    // User requested fixed 5s delay between posts
                    if (result.status !== 'duplicate') {
                        const delayMs = 5000;

                        console.log(`[BlueskyPoller] Processed ${result.status} incident. Waiting ${delayMs / 1000}s before continuing...`);
                        await new Promise(resolve => setTimeout(resolve, delayMs));
                    }
                } catch (error) {
                    console.error(`[BlueskyPoller] CRITICAL: Failed to process post ${postUrl}:`, error instanceof Error ? error.message : error);
                    console.log('[BlueskyPoller] Continuing to next post despite error in 5s...');
                    // Still wait a bit so we don't spam errors
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }

            // Move to next batch
            currentBatchIndex++;
            if (currentBatchIndex * BATCH_SIZE >= KEYWORDS.length) {
                currentBatchIndex = 0;
            }

        } catch (error: any) {
            console.error('[BlueskyPoller] Error during poll cycle:', error);
            if (error.message?.includes('429')) {
                console.log('[BlueskyPoller] Rate limited. Pausing for 60s...');
                await new Promise(resolve => setTimeout(resolve, 60000));
            }
        } finally {
            isProcessing = false;
        }
    }, POLL_INTERVAL_MS);
}
