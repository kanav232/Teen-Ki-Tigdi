import { BskyAgent } from '@atproto/api';

// Re-exporting minimal types used by the poller
export interface BlueskyPost {
    uri: string;
    cid: string;
    author: {
        did: string;
        handle: string;
        displayName?: string;
        avatar?: string;
    };
    record: {
        text: string;
        createdAt: string;
        $type: string;
    };
    embed?: {
        $type: string;
        images?: {
            alt: string;
            fullsize: string;
            thumb: string;
        }[];
    };
}

export class BlueskyClient {
    private agent: BskyAgent;
    private isAuthenticated: boolean = false;

    constructor() {
        this.agent = new BskyAgent({
            service: 'https://bsky.social'
        });
        console.log('[BlueskyClient] Initialized (Real API Mode)');
    }

    async login() {
        if (this.isAuthenticated) return;

        const identifier = process.env.BLUESKY_IDENTIFIER;
        const password = process.env.BLUESKY_PASSWORD;

        if (!identifier || !password) {
            console.warn('[BlueskyClient] Missing BLUESKY_IDENTIFIER or BLUESKY_PASSWORD in .env. Falling back to unauthenticated/mock behavior may fail.');
            return;
        }

        try {
            await this.agent.login({ identifier, password });
            this.isAuthenticated = true;
            console.log('[BlueskyClient] Logged in successfully');
        } catch (error) {
            console.error('[BlueskyClient] Login failed:', error);
            // Don't throw, allow retry
        }
    }

    async searchPosts(query: string): Promise<BlueskyPost[]> {
        if (!this.isAuthenticated) {
            console.warn('[BlueskyClient] Not authenticated. Attempting login...');
            await this.login();
            if (!this.isAuthenticated) {
                console.error('[BlueskyClient] Cannot search without authentication.');
                return [];
            }
        }

        // console.log(`[BlueskyClient] Searching for: "${query}"`);

        try {
            const response = await this.agent.app.bsky.feed.searchPosts({
                q: query,
                limit: 10
            });

            if (!response.success) {
                console.error('[BlueskyClient] Search failed:', response);
                return [];
            }

            // Map to our simplified interface
            return response.data.posts.map((post: any) => ({
                uri: post.uri,
                cid: post.cid,
                author: {
                    did: post.author.did,
                    handle: post.author.handle,
                    displayName: post.author.displayName,
                    avatar: post.author.avatar
                },
                record: post.record as any,
                embed: post.embed as any
            }));

        } catch (error) {
            console.error('[BlueskyClient] Search error:', error);
            return [];
        }
    }
    async getAuthorPosts(handle: string): Promise<BlueskyPost[]> {
        if (!this.isAuthenticated) {
            await this.login();
        }

        // console.log(`[BlueskyClient] Fetching posts for: ${handle}`);

        try {
            const response = await this.agent.getAuthorFeed({
                actor: handle,
                limit: 5,
                filter: 'posts_no_replies'
            });

            if (!response.success) {
                console.error('[BlueskyClient] Fetch Author Feed failed:', response);
                return [];
            }

            return response.data.feed.map((item: any) => ({
                uri: item.post.uri,
                cid: item.post.cid,
                author: {
                    did: item.post.author.did,
                    handle: item.post.author.handle,
                    displayName: item.post.author.displayName,
                    avatar: item.post.author.avatar
                },
                record: item.post.record as any,
                embed: item.post.embed as any
            }));
        } catch (error) {
            console.error('[BlueskyClient] Fetch Author Feed error:', error);
            return [];
        }
    }
}

export const blueskyClient = new BlueskyClient();
