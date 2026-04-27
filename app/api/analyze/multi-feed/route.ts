import { NextResponse } from 'next/server';
import { CompetitorScraper } from '@/engine/scraper';
import { resolveIgBusinessAccountId, getBusinessDiscovery } from '@/lib/instagram-graph';

// HikerAPI configuration (as a stable alternative to instagrapi)
const HIKER_API_KEY = process.env.HIKER_API_KEY; 
const HIKER_BASE_URL = 'https://api.hikerapi.com/v1';

async function fetchWithHiker(username: string) {
  if (!HIKER_API_KEY) return null;
  try {
    console.log(`[MultiFeed] Attempting HikerAPI for ${username}...`);
    const res = await fetch(`${HIKER_BASE_URL}/user/medias/chunk?username=${username}`, {
      headers: { 'x-access-key': HIKER_API_KEY }
    });
    if (!res.ok) throw new Error(`HikerAPI error: ${res.status}`);
    const data = await res.json();
    return (data || []).map((p: any) => ({
      url: p.thumbnail_url || p.resources?.[0]?.thumbnail_url || p.image_versions2?.candidates?.[0]?.url,
      permalink: `https://www.instagram.com/p/${p.code}/`,
      likes: p.like_count,
      comments: p.comment_count,
      username: username,
      source: 'hiker'
    }));
  } catch (e: any) {
    console.warn(`[MultiFeed] HikerAPI failed for ${username}:`, e.message);
    return null;
  }
}

function extractUsername(input: string): string | null {
  if (!input) return null;
  const clean = input.trim();
  
  // 1. Check if it's a URL
  if (clean.includes('instagram.com') || clean.includes('instagr.am')) {
    const match = clean.match(/(?:instagram\.com\/|instagr\.am\/)([a-zA-Z0-9_.]+)/);
    if (match && match[1]) return match[1];
  }
  
  // 2. Check if it starts with @
  if (clean.startsWith('@')) {
    return clean.substring(1);
  }
  
  // 3. Check if it's a simple username
  if (/^[a-zA-Z0-9_.]+$/.test(clean)) {
    return clean;
  }
  
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { urls, graphToken, igAccountId } = body;
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ success: false, error: 'URLs array required' }, { status: 400 });
    }

    // Proactive ID resolution if token exists but ID is missing
    const finalToken = (graphToken || process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();
    let finalId = (igAccountId || process.env.INSTAGRAM_ACCOUNT_ID || '').trim();

    console.log(`[MultiFeed] Using Token: ${finalToken ? (finalToken.substring(0, 10) + '...') : 'None'}`);
    console.log(`[MultiFeed] Using Account ID: ${finalId || 'None (Auto-resolving...)'}`);

    if (finalToken && !finalId) {
      try {
        console.log('[MultiFeed] igAccountId missing, attempting auto-resolve...');
        finalId = await resolveIgBusinessAccountId(finalToken);
      } catch (e: any) {
        console.warn('[MultiFeed] Could not resolve ID from token:', e.message);
      }
    }

    const allPosts: any[] = [];
    const scraper = new CompetitorScraper();
    const verifiedUsernames: string[] = [];
    const sourceMethod: Record<string, string> = {};
    const methodErrors: Record<string, string> = {};

    // Initialize all with 'none'
    urls.forEach(url => {
      const u = extractUsername(url);
      if (u) sourceMethod[u] = 'none';
    });

    console.log(`[MultiFeed] Processing ${urls.length} competitors:`, urls);

    // Parallel processing with simple concurrency limit (2 for stability)
    const processCompetitor = async (input: string) => {
      if (!input || input.trim() === '') return [];
      const username = extractUsername(input);
      if (!username) return [];

      const fullUrl = `https://www.instagram.com/${username}/`;
      
      // Check if we already have data for this user in session/cache if possible
      // (Skipping cache for now to ensure freshness as requested)

      return await Promise.race([
        (async () => {
          try {
            // 1. Try Graph API (FAST)
            if (finalToken && finalId) {
              try {
                const data = await getBusinessDiscovery(finalToken, finalId, username);
                if (data && data.username) {
                  verifiedUsernames.push(username.toLowerCase());
                  sourceMethod[username] = 'graph';
                  return data.media?.data
                    .filter((p: any) => p.media_url || p.thumbnail_url)
                    .map((p: any) => ({
                      url: p.media_url || p.thumbnail_url,
                      permalink: p.permalink,
                      likes: p.like_count,
                      comments: p.comments_count,
                      username: username,
                      source: 'graph'
                    })) || [];
                }
              } catch (e: any) {
                console.warn(`[MultiFeed] Graph API failed for ${username}`);
                methodErrors[username] = `Graph: ${e.message}`;
              }
            }

            // 2. Try HikerAPI
            if (HIKER_API_KEY) {
              try {
                const hikerPosts = await fetchWithHiker(username);
                if (hikerPosts && hikerPosts.length > 0) {
                  verifiedUsernames.push(username.toLowerCase());
                  sourceMethod[username] = 'hiker';
                  return hikerPosts;
                }
              } catch (e: any) {
                console.warn(`[MultiFeed] HikerAPI failed for ${username}`);
                methodErrors[username] = (methodErrors[username] ? methodErrors[username] + ' | ' : '') + `Hiker: ${e.message}`;
              }
            }

            // 3. Try Comprehensive Scraper (includes instagrapi local bridge)
            console.log(`[MultiFeed] Falling back to Scraper/Bridge for ${username}`);
            const data = await scraper.scrapeProfile(fullUrl);
            if (data && data.posts && data.posts.length > 0) {
              verifiedUsernames.push(username.toLowerCase());
              sourceMethod[username] = data.source || 'scraper';
              return data.posts.map((p: any) => ({ 
                ...p, 
                username,
                source: p.source || data.source || 'scraper',
                url: p.url.startsWith('http') ? p.url : `https://www.instagram.com${p.url}`
              }));
            } else if (data && data.error) {
               methodErrors[username] = (methodErrors[username] ? methodErrors[username] + ' | ' : '') + `Scraper: ${data.error}`;
            }

            console.warn(`[MultiFeed] All methods failed for ${username}`);
            return [];
          } catch (err: any) {
            console.error(`[MultiFeed] Error processing ${username}:`, err);
            methodErrors[username] = (methodErrors[username] ? methodErrors[username] + ' | ' : '') + `System: ${err.message}`;
            return [];
          }
        })(),
        new Promise<any[]>((resolve) => setTimeout(() => {
          console.error(`[MultiFeed] Timeout for ${username}`);
          methodErrors[username] = "Timeout after 60s";
          resolve([]);
        }, 60000))
      ]);
    };

    const results: any[][] = [];
    const concurrencyLimit = 2; // Reduced for better stability
    for (let i = 0; i < urls.length; i += concurrencyLimit) {
      const chunk = urls.slice(i, i + concurrencyLimit);
      const chunkResults = await Promise.all(chunk.map(url => processCompetitor(url)));
      results.push(...chunkResults);
    }

    results.forEach((posts, idx) => {
      const input = urls[idx];
      const username = extractUsername(input) || input;
      // Filter out junk URLs that are likely static resources
      const validPosts = posts.filter(p => {
        const isJunk = 
          !p.url || 
          p.url.includes('static.cdninstagram.com') || 
          p.url.includes('rsrc.php') ||
          p.url.includes('/static/');
          
        const isCDN = p.url?.includes('fbcdn.net') || p.url?.includes('instagram.com');
        const isFallback = p.source === 'picuki' || p.source === 'imginn' || p.source === 'dumpoir' || p.source === 'instanav' || p.source === 'instagrapi';
        
        return !isJunk && (isCDN || isFallback);
      });
      
      console.log(`[MultiFeed] ${username}: found ${posts.length} raw, ${validPosts.length} valid. Method: ${sourceMethod[username]}`);
      allPosts.push(...validPosts);
    });

    // Mix brands
    const brands = Array.from(new Set(allPosts.map(p => p.username)));
    const mixedPosts: any[] = [];
    let hasMore = true;
    let round = 0;
    
    while (hasMore && mixedPosts.length < 100) {
      hasMore = false;
      for (const brand of brands) {
        const brandPosts = allPosts.filter(p => p.username === brand);
        if (brandPosts[round]) {
          mixedPosts.push(brandPosts[round]);
          hasMore = true;
        }
      }
      round++;
    }

    return NextResponse.json({ 
      success: true, 
      posts: mixedPosts, 
      verifiedUsernames: Array.from(new Set(verifiedUsernames)),
      debug: { sourceMethod, errors: methodErrors }
    });
  } catch (error: any) {
    console.error('[MultiFeed API Error]', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
