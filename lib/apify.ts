/**
 * Apify Client Wrapper for Instagram Profile Scraping
 * 
 * Uses Apify's Instagram Profile Scraper actor to fetch public profile data.
 * API token is stored server-side only — never exposed to the client.
 */

const APIFY_BASE_URL = "https://api.apify.com/v2";
const ACTOR_ID = "apify~instagram-profile-scraper";
const ACTOR_TIMEOUT_SECS = 60;
const MAX_RETRIES = 2;

export interface InstagramProfileData {
  username: string;
  fullName: string;
  biography: string;
  followersCount: number;
  followsCount: number;
  postsCount: number;
  profilePicUrl: string;
  isVerified: boolean;
  isPrivate: boolean;
  externalUrl: string | null;
  recentPosts: InstagramPost[];
}

export interface InstagramPost {
  id: string;
  shortCode: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  videoViewCount: number | null;
  timestamp: string;
  url: string;
  displayUrl: string;
  type: "Image" | "Video" | "Sidecar";
}

function getApifyToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error(
      "APIFY_API_TOKEN is not configured. Add it to your .env file."
    );
  }
  return token;
}

/**
 * Validate Instagram username format.
 * Only allows alphanumeric characters, dots, and underscores (1-30 chars).
 */
export function validateInstagramUsername(username: string): boolean {
  return /^[a-zA-Z0-9._]{1,30}$/.test(username);
}

/**
 * Sanitize Instagram username by removing @ prefix and trimming whitespace.
 */
export function sanitizeInstagramUsername(rawInput: string): string {
  return rawInput.trim().replace(/^@/, "").toLowerCase();
}

/**
 * Scrape a public Instagram profile using Apify actor.
 * Returns structured profile data including recent posts.
 */
export async function scrapeInstagramProfile(
  username: string
): Promise<InstagramProfileData> {
  const token = getApifyToken();
  const sanitized = sanitizeInstagramUsername(username);

  if (!validateInstagramUsername(sanitized)) {
    throw new Error("Invalid Instagram username format.");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Run the actor synchronously and get dataset items
      const runResponse = await fetch(
        `${APIFY_BASE_URL}/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usernames: [sanitized],
            resultsLimit: 12,
            addParentData: false,
          }),
          signal: AbortSignal.timeout(ACTOR_TIMEOUT_SECS * 1000),
        }
      );

      if (!runResponse.ok) {
        const errorBody = await runResponse.text();
        throw new Error(
          `Apify API error (${runResponse.status}): ${errorBody.slice(0, 200)}`
        );
      }

      const items = await runResponse.json();

      if (!Array.isArray(items) || items.length === 0) {
        throw new Error(
          `No data returned for @${sanitized}. The profile may be private or does not exist.`
        );
      }

      // The first item is the profile data
      const profile = items[0];

      // Check if account is private
      if (profile.private || profile.isPrivate) {
        throw new Error(
          `@${sanitized} is a private account. Only public profiles can be connected.`
        );
      }

      // Map Apify response to our structured format
      const recentPosts: InstagramPost[] = (profile.latestPosts || [])
        .slice(0, 12)
        .map((post: any) => ({
          id: post.id || post.shortCode || "",
          shortCode: post.shortCode || "",
          caption: (post.caption || "").slice(0, 500),
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          videoViewCount: post.videoViewCount || null,
          timestamp: post.timestamp || post.takenAtTimestamp || "",
          url: post.url || `https://www.instagram.com/p/${post.shortCode}/`,
          displayUrl: post.displayUrl || "",
          type: post.type || "Image",
        }));

      const profileData: InstagramProfileData = {
        username: profile.username || sanitized,
        fullName: profile.fullName || "",
        biography: (profile.biography || "").slice(0, 1000),
        followersCount: profile.followersCount || 0,
        followsCount: profile.followsCount || 0,
        postsCount: profile.postsCount || 0,
        profilePicUrl: profile.profilePicUrl || profile.profilePicUrlHD || "",
        isVerified: profile.verified || profile.isVerified || false,
        isPrivate: false,
        externalUrl: profile.externalUrl || null,
        recentPosts,
      };

      return profileData;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Don't retry on validation/private account errors
      if (
        lastError.message.includes("private account") ||
        lastError.message.includes("does not exist") ||
        lastError.message.includes("Invalid Instagram username")
      ) {
        throw lastError;
      }

      // Wait before retry (exponential backoff)
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("Failed to scrape Instagram profile.");
}
