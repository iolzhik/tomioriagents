import { NextResponse } from 'next/server';
import { CompetitorScraper } from '@/engine/scraper';
import { analyzeCompetitor } from '@/lib/openai';
import { RAGEngine } from '@/lib/rag-engine';
import { getBusinessDiscovery, resolveIgBusinessAccountId } from '@/lib/instagram-graph';

// HikerAPI configuration
const HIKER_API_KEY = process.env.HIKER_API_KEY;
const HIKER_BASE_URL = 'https://api.hikerapi.com/v1';

async function fetchWithHiker(username: string) {
  if (!HIKER_API_KEY) return null;
  try {
    console.log(`[API] Attempting HikerAPI for ${username}...`);
    const res = await fetch(`${HIKER_BASE_URL}/user/medias/chunk?username=${username}`, {
      headers: { 'x-access-key': HIKER_API_KEY }
    });
    if (!res.ok) throw new Error(`HikerAPI error: ${res.status}`);
    const data = await res.json();
    return {
      success: true,
      username: username,
      posts: (data || []).map((p: any) => ({
        url: p.thumbnail_url || p.resources?.[0]?.thumbnail_url || p.image_versions2?.candidates?.[0]?.url,
        permalink: `https://www.instagram.com/p/${p.code}/`,
        likes: p.like_count,
        comments: p.comment_count,
        caption: p.caption?.text || ""
      }))
    };
  } catch (e: any) {
    console.warn(`[API] HikerAPI failed for ${username}:`, e.message);
    return null;
  }
}

async function scrapeWithGraphAPI(accessToken: string, igBusinessAccountId: string | null, targetUsername: string): Promise<any> {
  try {
    let callerId = igBusinessAccountId;
    
    // Auto-resolve ID if not provided
    if (!callerId) {
      console.log('[API] Resolving IG Business Account ID from token...');
      callerId = await resolveIgBusinessAccountId(accessToken);
    }

    const data = await getBusinessDiscovery(accessToken, callerId as string, targetUsername);
    
    // Normalize data format for analysis
    return {
      success: true,
      username: data.username,
      description: data.biography,
      follower_count: data.followers_count,
      media_count: data.media_count,
      posts: data.media?.data.map(p => ({
        caption: p.caption,
        url: p.media_url,
        likes: p.like_count,
        comments: p.comments_count,
        timestamp: p.timestamp,
        permalink: p.permalink
      })) || [],
      websiteText: data.website || data.biography
    };
  } catch (err: any) {
    console.error('[API] Graph API Discovery failed:', err.message);
    throw err;
  }
}

function extractInstagramUsername(input: string): string | null {
  // If it's already a simple username (no slashes, no dots except maybe at start)
  if (!input.includes('/') && !input.includes('?')) {
    return input.replace('@', '');
  }

  // If it's a URL
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    if (url.hostname.includes('instagram.com')) {
      const pathParts = url.pathname.split('/').filter(p => p.length > 0);
      if (pathParts.length > 0) {
        // Handle cases like instagram.com/username/ or instagram.com/username?igshid=...
        return pathParts[0];
      }
    }
  } catch (e) {
    // Not a valid URL, maybe it's a weird username
  }
  
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { competitorUrl, openaiKey, openRouterKey, grokKey, geminiKey, aiProvider, selectedModel, graphToken, igAccountId } = body;

    const config = {
      apiKey: aiProvider === 'openrouter' ? openRouterKey : (aiProvider === 'grok' ? grokKey : (aiProvider === 'gemini' ? geminiKey : openaiKey)),
      provider: aiProvider,
      model: selectedModel
    };

    if (!competitorUrl) {
      return NextResponse.json({ success: false, error: 'Competitor URL required' }, { status: 400 });
    }

    const igUsername = extractInstagramUsername(competitorUrl);
    let scrapedData = null;
    const methodErrors: string[] = [];

    // 0. Try Instagram Graph API if token is provided
    const finalToken = (graphToken || process.env.INSTAGRAM_ACCESS_TOKEN || '').trim();
    const finalId = (igAccountId || process.env.INSTAGRAM_ACCOUNT_ID || '').trim();

    // Strict token validation: must be at least 50 chars and start with EA... or IG...
    const isProbablyValidToken = finalToken.length > 50 && (finalToken.startsWith('EA') || finalToken.startsWith('IG'));

    if (igUsername && isProbablyValidToken) {
      try {
        console.log(`[API] Attempting Graph API Discovery for IG user: ${igUsername}`);
        scrapedData = await scrapeWithGraphAPI(finalToken, finalId || null, igUsername);
        if (scrapedData && scrapedData.posts && scrapedData.posts.length > 0) {
          console.log(`[API] Graph API success for ${igUsername}`);
        } else {
          console.warn(`[API] Graph API returned 0 posts for ${igUsername}`);
          scrapedData = null; // Continue to fallbacks
          methodErrors.push(`Graph API: 0 posts found`);
        }
      } catch (err: any) {
        console.warn(`[API] Graph API Discovery failed for ${igUsername}:`, err.message);
        methodErrors.push(`Graph API: ${err.message}`);
        scrapedData = null;
      }
    } else if (igUsername && finalToken) {
       console.log(`[API] Skipping Graph API: Token appears malformed or too short.`);
       methodErrors.push(`Graph API: Skipped (invalid token format)`);
    }

    // 1. Try HikerAPI (Stable Proxy for instagrapi)
    if (igUsername && !scrapedData && HIKER_API_KEY && HIKER_API_KEY.length > 5) {
      try {
        scrapedData = await fetchWithHiker(igUsername);
        if (scrapedData && scrapedData.posts && scrapedData.posts.length > 0) {
          console.log(`[API] HikerAPI success for ${igUsername}`);
        } else {
          console.warn(`[API] HikerAPI returned 0 posts for ${igUsername}`);
          scrapedData = null;
          methodErrors.push(`HikerAPI: 0 posts found`);
        }
      } catch (e: any) {
        console.warn(`[API] HikerAPI fallback failed for ${igUsername}`);
        methodErrors.push(`HikerAPI: ${e.message}`);
        scrapedData = null;
      }
    } else if (igUsername && !scrapedData) {
       methodErrors.push(`HikerAPI: Skipped (no key)`);
    }

    // 2. Try Scraper Fallback (instagrapi, Direct or Public Viewers)
    if (!scrapedData) {
      try {
        console.log(`[API] Scraping profile: ${competitorUrl}`);
        const scraper = new CompetitorScraper();
        scrapedData = await scraper.scrapeProfile(competitorUrl);
        
        // Ensure posts are valid for analysis
        if (scrapedData && scrapedData.posts && Array.isArray(scrapedData.posts) && scrapedData.posts.length > 0) {
           console.log(`[API] Scraper success via ${scrapedData.source || 'unknown'}. Found ${scrapedData.posts.length} posts.`);
        } else {
           const err = scrapedData?.error || '0 posts found across all 5 public mirrors';
           methodErrors.push(`Scraper: ${err}`);
           scrapedData = null;
        }
      } catch (err: any) {
        console.error('[API] Scraper failed:', err.message);
        methodErrors.push(`Scraper System: ${err.message}`);
        scrapedData = null;
      }
    }

    if (!scrapedData || (!scrapedData.posts?.length && !scrapedData.websiteText)) {
      console.warn(`[API] ALL SCRAPING METHODS FAILED for ${competitorUrl}. Switching to AI Strategic Simulation Mode.`);
      
      // Instead of failing, we provide a simulated data structure
      scrapedData = {
        success: true,
        isSimulated: true,
        username: igUsername || competitorUrl,
        posts: [],
        websiteText: `Система не смогла получить свежие посты @${igUsername || competitorUrl} из-за временных ограничений Instagram. Анализ будет проведен на основе рыночных данных и общей стратегии бренда.`,
        description: `Аккаунт ювелирного бренда @${igUsername || competitorUrl}.`
      };
    }

    // 3. AI Analysis for Tomiori
    const report = await analyzeCompetitor(
      competitorUrl, 
      scrapedData.posts || [], 
      config, 
      scrapedData.websiteText || scrapedData.description,
      scrapedData.isSimulated // Pass the simulation flag
    );

    if (!report) {
       throw new Error("AI failed to generate analysis report");
    }

    const analysisReport = report;
    
    try {
      // Self-Learning: Save analysis report to Memory Bank
      const rag = new RAGEngine(config);
      await rag.learnFromSystemOutput('intel', `Competitor Analysis for ${competitorUrl}`, analysisReport);
    } catch (aiErr: any) {
      console.error('[API] AI Memory Bank update failed:', aiErr.message);
    }

    // 4. Get Trends
    let trends: any[] = [];
    try {
      const scraper = new CompetitorScraper();
      const fetchedTrends = await scraper.getJewelryTrends();
      trends = fetchedTrends || [];
    } catch (trendErr) {
      console.warn('[API] Failed to fetch trends');
    }

    return NextResponse.json({ 
      success: true, 
      scrapedData, 
      analysisReport,
      trends
    });

  } catch (error: any) {
    console.error('[API Critical Error]', error);
    return NextResponse.json({ 
      success: false, 
      error: `Критическая ошибка сервера: ${error.message || 'Неизвестная ошибка'}` 
    }, { status: 500 });
  }
}
