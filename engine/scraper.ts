import { chromium } from 'playwright';
import { TrendScraper } from '@/lib/trend-scraper';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export class CompetitorScraper {
  /**
   * Scrape a profile (Instagram or general website)
   */
  async scrapeProfile(profileUrl: string) {
    const isInstagram = profileUrl.includes('instagram.com');
    const username = profileUrl.split('instagram.com/')[1]?.split('/')[0]?.replace('@', '');

    // 0. Priority Attempt for Instagram: instagrapi-proxy.py
    if (isInstagram && username) {
      try {
        console.log(`[Scraper] Priority Attempt: Calling instagrapi for ${username}...`);
        // We use the absolute path to the python script
        const scriptPath = '/Users/erasyl/tomioriagents/engine/instagrapi-proxy.py';
        const { stdout } = await execPromise(`python3 "${scriptPath}" "${username}"`);
        const result = JSON.parse(stdout);
        
        if (result.success && result.posts && result.posts.length > 0) {
          console.log(`[Scraper] instagrapi success for ${username}: found ${result.posts.length} posts`);
          return {
            profile: profileUrl,
            ...result,
            source: 'instagrapi',
            timestamp: new Date().toISOString()
          };
        } else {
          console.warn(`[Scraper] instagrapi returned no posts or error for ${username}:`, result.error);
        }
      } catch (err: any) {
        console.warn(`[Scraper] instagrapi bridge failed for ${username}:`, err.message);
        // Continue to other methods...
      }
    }

    // Using standard chromium since playwright-extra/stealth plugin has issues with Turbopack/Next.js 16
    const browser = await chromium.launch({ headless: true });
    
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
    ];

    const context = await browser.newContext({
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
      locale: 'ru-RU,ru;q=0.9',
      timezoneId: 'Europe/Moscow',
      permissions: ['geolocation'],
      ignoreHTTPSErrors: true
    });
    
    // Add custom headers to look more like a real browser
    await context.setExtraHTTPHeaders({
      'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Ch-Ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Google Chrome";v="114"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Optimize performance: only block very heavy non-essential stuff
    await context.route('**/*.{css,woff,woff2,ttf,otf}', (route) => {
      route.abort();
    });

    const page = await context.newPage();

    console.log(`[Scraper] Analyzing: ${profileUrl}`);
    
    try {
      // 1. First attempt: standard desktop view
      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for the grid to potentially load (main element is usually the container)
      try {
        await page.waitForSelector('main', { timeout: 10000 });
      } catch (e) {
        console.warn(`[Scraper] 'main' selector not found for ${profileUrl}, proceeding anyway...`);
      }
      
      await page.waitForTimeout(5000); // Give it more time for JS execution

      // Try to close login modal if it appears (common on IG)
      try {
        const closeBtn = await page.getByRole('button', { name: /Close|Закрыть/i });
        if (await closeBtn.isVisible()) {
          await closeBtn.click();
          await page.waitForTimeout(1000);
        }
        
        const notNow = await page.getByText(/Not Now|Не сейчас/i);
        if (await notNow.isVisible()) {
          await notNow.click();
          await page.waitForTimeout(1000);
        }
      } catch (e) {}

      // Scroll multiple times to trigger lazy loading of the grid
      for (let i = 0; i < 3; i++) {
        await page.mouse.wheel(0, 1000);
        await page.waitForTimeout(1000);
      }

      const isInstagram = profileUrl.includes('instagram.com');

      let data = await page.evaluate((isIG) => {
        const result: any = {
          title: document.title,
          description: '',
          posts: [],
          websiteText: '',
          hitLoginWall: document.body.innerText.includes('Log In') && !document.querySelector('main')
        };

        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) result.description = metaDesc.getAttribute('content') || '';

        if (isIG) {
          // Instagram specific: try multiple discovery methods
          
          // Method 1: Find all <a> tags that look like posts and get their images
          const postLinks = Array.from(document.querySelectorAll('a[href*="/p/"]'));
          postLinks.forEach((link) => {
             const img = link.querySelector('img');
             const src = img?.getAttribute('src');
             if (src && (src.includes('fbcdn.net') || src.includes('instagram.com')) && !src.includes('rsrc.php')) {
                if (!result.posts.find((p: any) => p.url === src)) {
                   result.posts.push({
                      caption: img?.getAttribute('alt') || 'Instagram post',
                      url: src,
                      permalink: 'https://www.instagram.com' + link.getAttribute('href'),
                      source: 'grid-link'
                   });
                }
             }
          });

          // Method 2: standard <img> tags (fallback if Method 1 missed some)
          const imgs = Array.from(document.querySelectorAll('img')).filter(img => {
            const src = img.getAttribute('src') || '';
            // Filter out icons, small avatars, tracking pixels, and STATIC RESOURCES
            return (src.includes('fbcdn.net') || src.includes('instagram.com')) && 
                   !src.includes('150x150') && 
                   !src.includes('s150x150') &&
                   !src.includes('/static/') &&
                   !src.includes('rsrc.php') && 
                   !src.includes('emoji') &&
                   !src.includes('/v/t5.0-15/');
          });
          
          imgs.forEach((img, index) => {
            const src = img.getAttribute('src');
            const alt = img.getAttribute('alt') || 'Instagram post';
            if (index < 40 && src && !result.posts.find((p: any) => p.url === src)) {
              result.posts.push({
                caption: alt,
                url: src,
                source: 'img-tag'
              });
            }
          });
          
          // Method 3: JSON data in scripts (deep discovery)
          try {
            const scripts = Array.from(document.querySelectorAll('script'));
            scripts.forEach(script => {
              const text = script.textContent || '';
              
              // 3.1: display_url discovery
              const displayUrlMatches = text.match(/"display_url":"([^"]+)"/g);
              if (displayUrlMatches) {
                displayUrlMatches.slice(0, 20).forEach(m => {
                   const url = m.match(/"display_url":"([^"]+)"/)?.[1].replace(/\\u0026/g, '&');
                   if (url && !result.posts.find((p: any) => p.url === url)) {
                     result.posts.push({ caption: 'Instagram discovery', url: url, source: 'regex-json' });
                   }
                });
              }
              
              // 3.2: Direct CDN links (fallback for raw strings)
              const directLinks = text.match(/https:\/\/[^"']+\.cdninstagram\.com\/v\/[^"']+\.(?:jpg|webp|png)(?:\?[^"']*)?/g);
              if (directLinks) {
                directLinks.slice(0, 20).forEach(url => {
                   const cleanUrl = url.replace(/\\u0026/g, '&');
                   if (!result.posts.find((p: any) => p.url === cleanUrl)) {
                     result.posts.push({ caption: 'Instagram direct', url: cleanUrl, source: 'regex-cdn' });
                   }
                });
              }
            });
          } catch (e) {}
        } else {
          // General website logic: Much deeper extraction for AI analysis
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent?.trim()).filter(t => t);
          const paragraphs = Array.from(document.querySelectorAll('p, li, span')).map(p => p.textContent?.trim()).filter(t => t && t.length > 30);
          const metaTags = Array.from(document.querySelectorAll('meta')).map(m => m.getAttribute('content')).filter(t => t && t.length > 20);
          
          result.websiteText = [
            "HEADINGS:", ...headings.slice(0, 15), 
            "CONTENT:", ...paragraphs.slice(0, 40),
            "META:", ...metaTags.slice(0, 10)
          ].join('\n\n');
          
          const images = document.querySelectorAll('img');
          let count = 0;
          images.forEach((img) => {
            const src = img.getAttribute('src');
            const alt = img.getAttribute('alt') || '';
            if (count < 6 && src && (src.includes('product') || src.includes('item') || alt.length > 10)) {
              result.posts.push({
                caption: alt || 'Product image',
                url: src.startsWith('http') ? src : window.location.origin + (src.startsWith('/') ? '' : '/') + src
              });
              count++;
            }
          });
        }
        return result;
      }, isInstagram);

      // 2. Fallback Strategy: If no posts found OR hit login wall, try a Public Viewer (Picuki)
      if (isInstagram && (data.posts.length === 0 || data.hitLoginWall)) {
        const username = profileUrl.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
        if (username) {
          console.log(`[Scraper] Instagram wall hit for ${username}, trying Picuki fallback...`);
          try {
            const picukiUrl = `https://www.picuki.com/profile/${username}`;
            await page.goto(picukiUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
            await page.waitForTimeout(3000);
            
            const picukiData = await page.evaluate(() => {
              const posts: any[] = [];
              const items = Array.from(document.querySelectorAll('.post-container, .profile-post, .item, .post, .photo-item'));
              items.slice(0, 18).forEach(item => {
                const img = item.querySelector('.post-image, img, .photo, .post-container-img');
                const src = img?.getAttribute('src') || img?.getAttribute('data-src');
                const caption = item.querySelector('.post-description, .post-info, .description, .post-container-text')?.textContent?.trim() || 'Instagram post';
                if (src && src.startsWith('http')) {
                  posts.push({
                    caption,
                    url: src,
                    source: 'picuki'
                  });
                }
              });
              return posts;
            });
            
            if (picukiData.length > 0) {
              console.log(`[Scraper] Picuki fallback success for ${username}: found ${picukiData.length} posts`);
              data.posts.push(...picukiData);
              data.hitLoginWall = false;
              data.source = 'picuki';
            }
          } catch (picukiErr: any) {
            console.warn(`[Scraper] Picuki fallback failed for ${username}:`, picukiErr.message);
          }
        }
      }

      // 3. Last Resort Fallback: Imginn (if still no posts)
      if (isInstagram && data.posts.length === 0) {
        const username = profileUrl.split('instagram.com/')[1]?.split('/')[0];
        if (username) {
          console.log(`[Scraper] Trying Imginn fallback for ${username}...`);
          try {
            const imginnUrl = `https://imginn.com/user/${username}/`;
            await page.goto(imginnUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForTimeout(3000);
            
            const imginnData = await page.evaluate(() => {
              const posts: any[] = [];
              const items = Array.from(document.querySelectorAll('.post-item, .item, .post'));
              items.slice(0, 15).forEach(item => {
                const img = item.querySelector('img');
                const src = img?.getAttribute('src') || img?.getAttribute('data-src');
                if (src && src.startsWith('http')) {
                  posts.push({
                    caption: img?.getAttribute('alt') || 'Instagram post',
                    url: src,
                    source: 'imginn'
                  });
                }
              });
              return posts;
            });
            
            if (imginnData.length > 0) {
              console.log(`[Scraper] Imginn fallback success for ${username}: found ${imginnData.length} posts`);
              data.posts.push(...imginnData);
              data.hitLoginWall = false; // We bypassed it!
              data.source = 'imginn';
            }
          } catch (e) {}
        }
      }

      // 4. Emergency Fallback: Dumpoir (if still no posts)
      if (isInstagram && data.posts.length === 0) {
        const username = profileUrl.split('instagram.com/')[1]?.split('/')[0];
        if (username) {
          console.log(`[Scraper] Trying Dumpoir fallback for ${username}...`);
          try {
            const dumpoirUrl = `https://dumpoir.com/v/${username}`;
            await page.goto(dumpoirUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForTimeout(3000);
            
            const dumpoirData = await page.evaluate(() => {
              const posts: any[] = [];
              const items = Array.from(document.querySelectorAll('.post-item, .item, .post'));
              items.slice(0, 15).forEach(item => {
                const img = item.querySelector('img');
                const src = img?.getAttribute('src') || img?.getAttribute('data-src');
                if (src && src.startsWith('http')) {
                  posts.push({
                    caption: img?.getAttribute('alt') || 'Instagram post',
                    url: src,
                    source: 'dumpoir'
                  });
                }
              });
              return posts;
            });
            
            if (dumpoirData.length > 0) {
              console.log(`[Scraper] Dumpoir fallback success for ${username}: found ${dumpoirData.length} posts`);
              data.posts.push(...dumpoirData);
              data.hitLoginWall = false;
              data.source = 'dumpoir';
            }
          } catch (e) {}
        }
      }

      // 5. Final Fallback: InstaNavigation (if still no posts)
      if (isInstagram && data.posts.length === 0) {
        const username = profileUrl.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
        if (username) {
          console.log(`[Scraper] Trying InstaNavigation fallback for ${username}...`);
          try {
            const instaNavUrl = `https://instanavigation.com/user-profile/${username}`;
            await page.goto(instaNavUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForTimeout(3000);
            
            const navData = await page.evaluate(() => {
              const posts: any[] = [];
              const items = Array.from(document.querySelectorAll('.item, .post-item'));
              items.slice(0, 12).forEach(item => {
                const img = item.querySelector('img');
                const src = img?.getAttribute('src') || img?.getAttribute('data-src');
                if (src && src.startsWith('http')) {
                  posts.push({
                    caption: img?.getAttribute('alt') || 'Instagram post',
                    url: src,
                    source: 'instanav'
                  });
                }
              });
              return posts;
            });
            
            if (navData.length > 0) {
              console.log(`[Scraper] InstaNavigation fallback success for ${username}: found ${navData.length} posts`);
              data.posts.push(...navData);
              data.hitLoginWall = false;
              data.source = 'instanav';
            }
          } catch (e) {}
        }
      }

      // 6. Emergency Fallback: Greatfon
      if (isInstagram && data.posts.length === 0) {
        const username = profileUrl.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
        if (username) {
          console.log(`[Scraper] Trying Greatfon fallback for ${username}...`);
          try {
            const greatfonUrl = `https://greatfon.com/v/${username}`;
            await page.goto(greatfonUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.waitForTimeout(3000);
            
            const gfData = await page.evaluate(() => {
              const posts: any[] = [];
              const items = Array.from(document.querySelectorAll('.post-item, .item, .post'));
              items.slice(0, 15).forEach(item => {
                const img = item.querySelector('img');
                const src = img?.getAttribute('src') || img?.getAttribute('data-src');
                if (src && src.startsWith('http')) {
                  posts.push({
                    caption: img?.getAttribute('alt') || 'Instagram post',
                    url: src,
                    source: 'greatfon'
                  });
                }
              });
              return posts;
            });
            
            if (gfData.length > 0) {
              console.log(`[Scraper] Greatfon fallback success for ${username}: found ${gfData.length} posts`);
              data.posts.push(...gfData);
              data.hitLoginWall = false;
              data.source = 'greatfon';
            }
          } catch (e) {}
        }
      }

      // 7. Last Ditch: Save-Insta
      if (isInstagram && data.posts.length === 0) {
        const username = profileUrl.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
        if (username) {
          console.log(`[Scraper] Trying Save-Insta fallback for ${username}...`);
          try {
            const saveInstaUrl = `https://www.save-insta.com/profile-downloader/`;
            await page.goto(saveInstaUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
            await page.fill('#url', username);
            await page.click('#send');
            await page.waitForTimeout(7000);
            
            const siData = await page.evaluate(() => {
              const posts: any[] = [];
              const imgs = Array.from(document.querySelectorAll('.download-content img, .profile-posts img'));
              imgs.slice(0, 10).forEach(img => {
                const src = img.getAttribute('src');
                if (src && src.startsWith('http')) {
                  posts.push({ caption: 'Instagram post', url: src, source: 'save-insta' });
                }
              });
              return posts;
            });
            
            if (siData.length > 0) {
              data.posts.push(...siData);
              data.source = 'save-insta';
            }
          } catch (e) {}
        }
      }

      // 8. Mirror Fallback: Inflact
      if (isInstagram && data.posts.length === 0) {
        const username = profileUrl.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
        if (username) {
          console.log(`[Scraper] Trying Inflact fallback for ${username}...`);
          try {
            const inflactUrl = `https://inflact.com/profiles/instagram-viewer/`;
            await page.goto(inflactUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            await page.fill('input[name="search"]', username);
            await page.click('button[type="submit"]');
            await page.waitForTimeout(8000);
            
            const inflactData = await page.evaluate(() => {
              const posts: any[] = [];
              const items = Array.from(document.querySelectorAll('.items-list .item, .post-item'));
              items.slice(0, 12).forEach(item => {
                const img = item.querySelector('img');
                const src = img?.getAttribute('src');
                if (src && src.startsWith('http')) {
                  posts.push({ caption: 'Instagram post', url: src, source: 'inflact' });
                }
              });
              return posts;
            });
            
            if (inflactData.length > 0) {
              data.posts.push(...inflactData);
              data.source = 'inflact';
            }
          } catch (e) {}
        }
      }

      // 9. FINAL EMERGENCY: Search Engine Discovery (DuckDuckGo/Google)
      // If Instagram mirrors are blocked, we search for the profile on a search engine
      // and extract the latest info from snippets.
      if (isInstagram && data.posts.length === 0) {
        const username = profileUrl.split('instagram.com/')[1]?.split('/')[0]?.split('?')[0];
        if (username) {
           console.log(`[Scraper] ALL MIRRORS BLOCKED. Trying Search Engine Discovery for ${username}...`);
           try {
              const searchUrl = `https://duckduckgo.com/?q=site%3Ainstagram.com%2F${username}&t=h_&ia=web`;
              await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
              await page.waitForTimeout(3000);
              
              const searchResults = await page.evaluate(() => {
                 const posts: any[] = [];
                 const snippets = Array.from(document.querySelectorAll('.react-results--main article, .result'));
                 snippets.slice(0, 10).forEach(s => {
                    const text = s.textContent || '';
                    // Try to find dates or captions in snippets
                    if (text.length > 30 && !text.includes('Instagram photos and videos')) {
                       posts.push({
                          caption: text.substring(0, 200).trim(),
                          url: 'https://www.instagram.com/static/images/ico/favicon-192.png/b811c693b278.png', // Fallback icon
                          source: 'search-snippet'
                       });
                    }
                 });
                 return posts;
              });
              
              if (searchResults.length > 0) {
                 console.log(`[Scraper] Search discovery success for ${username}: found ${searchResults.length} snippets`);
                 data.posts.push(...searchResults);
                 data.hitLoginWall = false;
                 data.source = 'search-engine';
                 data.websiteText = `Instagram Profile: @${username}\n\nLatest Snippets from Search:\n` + searchResults.map(r => r.caption).join('\n\n');
              }
           } catch (e: any) {
              console.warn(`[Scraper] Search discovery failed:`, e.message);
           }
        }
      }

      if (isInstagram && data.posts.length === 0) {
        data.error = "Instagram login wall blocked all 9 discovery methods (Mirrors, Search Discovery, instagrapi). Use a valid Graph Token for 100% stability.";
      }

      return {
        profile: profileUrl,
        ...data,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error(`[Scraper] Error scraping ${profileUrl}:`, error.message);
      // Return a minimal object so the API doesn't fail completely
      return {
        profile: profileUrl,
        error: error.message,
        posts: [],
        websiteText: 'Не удалось загрузить содержимое сайта автоматически.',
        timestamp: new Date().toISOString()
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Search for Jewelry Trends using the centralized TrendScraper
   */
  async getJewelryTrends() {
     const ts = new TrendScraper();
     return await ts.getJewelryTrends();
  }
}
