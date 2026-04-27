
/**
 * Instagram Graph API Helper for Business Discovery
 */

const FB_BASE = 'https://graph.facebook.com/v22.0';
const IG_BASE = 'https://graph.instagram.com/v22.0';

/**
 * Detect token type by prefix
 */
export function isIgToken(token: string) {
  return token.startsWith('IGAA') || token.startsWith('IGQ') || token.startsWith('IG');
}

/**
 * Get the correct base URL for the given token
 * Note: Business Discovery and most Business-related features 
 * are only available via FB_BASE (graph.facebook.com)
 */
export function getBaseUrl(token: string, forceBusiness: boolean = false) {
  if (forceBusiness) return FB_BASE;
  return isIgToken(token) ? IG_BASE : FB_BASE;
}

/**
 * Resolve your own Instagram Business Account ID from a token.
 * This is the 'caller' ID required for Business Discovery.
 */
export async function resolveIgBusinessAccountId(accessToken: string): Promise<string> {
  const cleanToken = accessToken.trim();
  // 1. Try Instagram Graph API base (Direct) first if it looks like an IG token
  if (isIgToken(cleanToken)) {
    try {
      console.log(`[Instagram API] Resolving ID using IG_BASE for IG token`);
      const res = await fetch(`${IG_BASE}/me?fields=id,username&access_token=${cleanToken}`);
      const data = await res.json();
      if (!data.error) return data.id;
      console.warn('[Instagram API] IG_BASE check failed:', data.error.message);
    } catch (e) {}
  }

  // 2. Try FB_BASE for Business IDs (standard for EAA... tokens)
  try {
    console.log(`[Instagram API] Resolving ID using FB_BASE`);
    const res = await fetch(`${FB_BASE}/me?fields=id,username&access_token=${cleanToken}`);
    const data = await res.json();
    if (!data.error) return data.id;
    console.warn('[Instagram API] FB_BASE "me" check failed:', data.error.message);
  } catch (e) {}
  
  // 3. Facebook User token (EAA...) -> Go through Pages -> IG Business account
  console.log('[Instagram API] Trying Pages path as fallback...');
  const meRes = await fetch(`${FB_BASE}/me?fields=id&access_token=${cleanToken}`);
  const me = await meRes.json();
  if (me.error) throw new Error(`Auth error: ${me.error.message}`);

  const pagesRes = await fetch(`${FB_BASE}/${me.id}/accounts?fields=id,instagram_business_account&access_token=${cleanToken}`);
  const pages = await pagesRes.json();
  if (pages.error) throw new Error(`Pages error: ${pages.error.message}`);

  const page = pages.data?.find((p: any) => p.instagram_business_account);
  if (!page) throw new Error('Instagram Business account not found connected to your FB pages. Ensure your account is a Professional/Business account.');

  return page.instagram_business_account.id;
}

export interface BusinessDiscoveryData {
  id: string;
  ig_id: string;
  username: string;
  name: string;
  biography: string;
  profile_picture_url: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  website: string;
  media?: {
    data: Array<{
      id: string;
      caption: string;
      comments_count: number;
      like_count: number;
      media_type: string;
      media_url: string;
      permalink: string;
      timestamp: string;
    }>;
  };
}

/**
 * Perform Business Discovery for a specific Instagram username
 */
export async function getBusinessDiscovery(accessToken: string, igBusinessAccountId: string, targetUsername: string): Promise<BusinessDiscoveryData> {
  const cleanToken = accessToken.trim();
  // Business Discovery is ONLY available on graph.facebook.com (FB_BASE)
  const base = FB_BASE;
  const fields = `business_discovery.username(${targetUsername}){id,ig_id,username,name,biography,profile_picture_url,followers_count,follows_count,media_count,website,media{id,caption,comments_count,like_count,media_type,media_url,thumbnail_url,permalink,timestamp}}`;
  
  const url = `${base}/${igBusinessAccountId}?fields=${encodeURIComponent(fields)}&access_token=${cleanToken}`;
  
  console.log(`[Instagram API] Business Discovery on base: ${base}`);
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    console.error('[Instagram API] Discovery error details:', data.error);
    throw new Error(`Instagram API Error: ${data.error.message}`);
  }
  
  return data.business_discovery;
}

/**
 * Fetch Instagram Direct Conversations
 */
export async function getConversations(accessToken: string, igBusinessAccountId: string) {
  const cleanToken = accessToken.trim();
  // Messaging features are available on graph.facebook.com
  const base = FB_BASE;
  // Using a simpler field set first to ensure compatibility
  const url = `${base}/${igBusinessAccountId}/conversations?platform=instagram&fields=id,updated_time,participants&access_token=${cleanToken}`;
  
  console.log(`[Instagram API] Fetching conversations: ${igBusinessAccountId}`);
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    console.error('[Instagram API] Conversations error:', data.error);
    throw new Error(`Instagram API Error: ${data.error.message}`);
  }
  
  // For each conversation, fetch the last few messages
  const conversations = data.data || [];
  for (const conv of conversations) {
    try {
      conv.messages = { data: await getMessages(cleanToken, conv.id) };
    } catch (e) {
      console.warn(`[Instagram API] Could not fetch messages for ${conv.id}`);
    }
  }
  
  return conversations;
}

/**
 * Debug Token Permissions
 */
export async function debugToken(accessToken: string) {
  const cleanToken = accessToken.trim();
  const url = `https://graph.facebook.com/debug_token?input_token=${cleanToken}&access_token=${cleanToken}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.data;
  } catch (e) {
    return null;
  }
}

/**
 * Fetch messages for a specific conversation
 */
export async function getMessages(accessToken: string, conversationId: string) {
  const cleanToken = accessToken.trim();
  const base = FB_BASE;
  const url = `${base}/${conversationId}/messages?fields=id,message,created_time,from&access_token=${cleanToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Instagram Messages Error: ${data.error.message}`);
  }
  
  return data.data;
}

/**
 * Search for Hashtag ID
 */
export async function getHashtagId(accessToken: string, igBusinessAccountId: string, hashtag: string): Promise<string> {
  const cleanToken = accessToken.trim();
  const base = FB_BASE;
  const url = `${base}/ig_hashtag_search?user_id=${igBusinessAccountId}&q=${encodeURIComponent(hashtag)}&access_token=${cleanToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Hashtag Search Error: ${data.error.message}`);
  }
  
  return data.data?.[0]?.id;
}

/**
 * Get Top Media for a Hashtag
 */
export async function getHashtagRecentMedia(accessToken: string, igBusinessAccountId: string, hashtagId: string) {
  const cleanToken = accessToken.trim();
  const base = FB_BASE;
  const fields = 'id,caption,comments_count,like_count,media_type,media_url,permalink';
  const url = `${base}/${hashtagId}/recent_media?user_id=${igBusinessAccountId}&fields=${encodeURIComponent(fields)}&access_token=${cleanToken}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Hashtag Media Error: ${data.error.message}`);
  }
  
  return data.data;
}
