import { chromium } from 'playwright';

export class TikTokCombine {
  private username: string;
  private storagePath: string;

  constructor(username: string) {
    this.username = username;
    this.storagePath = `./sessions/tt-\${username}.json`;
  }

  async init(proxy?: string) {
    const browser = await chromium.launch({ 
      headless: false,
      proxy: proxy ? { server: proxy } : undefined
    });
    
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      storageState: this.storagePath 
    });

    return { browser, context };
  }

  /**
   * TikTok Login Simulation
   */
  async login(password: string, proxy?: string) {
    const { browser, context } = await this.init(proxy);
    const page = await context.newPage();

    console.log(`[TT] Opening TikTok login for \${this.username}...`);
    
    try {
      await page.goto('https://www.tiktok.com/login/phone-or-email/email');
      await page.waitForTimeout(3000);

      // 1. Enter email/username
      await page.fill('input[type="text"]', this.username, { force: true });
      await page.waitForTimeout(1000);
      
      // 2. Enter password
      await page.fill('input[type="password"]', password, { force: true });
      await page.waitForTimeout(1000);

      // 3. Click login
      await page.click('button[type="submit"]');
      
      console.log(`[TT] Login button clicked. Check for puzzle captcha in browser window.`);
      
      // We wait for navigation indicating success or manual captcha solve
      await page.waitForURL('https://www.tiktok.com/foryou', { timeout: 120000 });
      
      await context.storageState({ path: this.storagePath });
      console.log(`[TT] Session saved successfully!`);

    } catch (error) {
      console.error(`[TT] Login error:`, error);
    } finally {
      await browser.close();
    }
  }

  /**
   * TikTok Video Upload Simulation
   */
  async uploadVideo(videoPath: string, caption: string) {
    const { browser, context } = await this.init();
    const page = await context.newPage();

    try {
      await page.goto('https://www.tiktok.com/upload');
      await page.waitForSelector('iframe');
      
      const frame = page.frame({ url: /tiktok.com\/upload/ });
      if (!frame) throw new Error('Could not find upload frame');

      // 1. Select file
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        frame.click('.upload-card'),
      ]);
      await fileChooser.setFiles(videoPath);
      
      // 2. Add AI-generated caption
      await page.waitForTimeout(5000); // Wait for upload start
      await frame.fill('.public-DraftEditor-content', caption);
      
      // 3. Post
      await frame.click('.button-post button');
      console.log(`[TT] Video posted successfully!`);
      
    } catch (error) {
      console.error(`[TT] Upload failed:`, error);
    } finally {
       await browser.close();
    }
  }
}
