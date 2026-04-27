
import { NextResponse } from 'next/server';
import { TrendScraper } from '@/lib/trend-scraper';

export const dynamic = 'force-dynamic';

/**
 * PRODUCTION-GRADE TRENDSPOTTING API (v5.0)
 * Real-time parsing of Jewelry & Luxury Trends for Kazakhstan (Astana/Almaty)
 */
export async function POST(req: Request) {
  try {
    const { graphToken, igAccountId } = await req.json().catch(() => ({}));
    const scraper = new TrendScraper();
    
    // In production, this performs a real scrape enriched by Instagram API if credentials provided
    const latestTrends = await scraper.scrapeTrends(graphToken, igAccountId);
    
    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      trends: latestTrends 
    });
  } catch (error: any) {
    console.error('Trends API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
