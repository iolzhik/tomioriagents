import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function GET() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const SEARCH_TARGETS = [
    { type: 'location', url: 'https://www.instagram.com/explore/locations/259648281/keruen-mall/' },
    { type: 'hashtag', url: 'https://www.instagram.com/explore/tags/astanaengagement/' },
    { type: 'hashtag', url: 'https://www.instagram.com/explore/tags/кериуен/' }
  ];

  try {
    const findings: any[] = [];

    // In a real app, logic would iterate over all TARGETS. For demo, we do one.
    const target = SEARCH_TARGETS[0];
    await page.goto(target.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);

    // Extract potential leads (people posting in Keruen recently)
    const leads = await page.evaluate(() => {
      const posts = document.querySelectorAll('article img');
      const results: any[] = [];
      posts.forEach((p, idx) => {
        if (idx < 5) {
          results.push({
             username: 'potential_guest_astana',
             snippet: p.getAttribute('alt') || 'Just posted in ТРЦ "Керуен"',
             type: 'UGC'
          });
        }
      });
      return results;
    });

    return NextResponse.json({ success: true, leads });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await browser.close();
  }
}
