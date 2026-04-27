import { chromium } from 'playwright';

export class ThreadsCombine {
  private username: string;
  private storagePath: string;

  constructor(username: string) {
    this.username = username;
    this.storagePath = `./sessions/threads-\${username}.json`;
  }

  async init(proxy?: string) {
    const browser = await chromium.launch({ 
      headless: false,
      proxy: proxy ? { server: proxy } : undefined
    });
    
    // Threads also uses mobile-first design, perfect for phone UserAgent
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Mobile/15E148 Safari/604.1',
      viewport: { width: 390, height: 844 },
      storageState: this.storagePath 
    });

    return { browser, context };
  }

  /**
   * Threads Login Simulation via Instagram
   */
  async login(password: string, proxy?: string) {
    const { browser, context } = await this.init(proxy);
    const page = await context.newPage();

    console.log(`[Threads] Opening Threads login for \${this.username}...`);
    
    try {
      await page.goto('https://www.threads.net/login');
      await page.waitForTimeout(3000);

      // Check if already logged in or if redirect to IG login
      if (page.url().includes('login')) {
        // Typing simulation
        await page.type('input[placeholder="Phone number, username, or email"]', this.username, { delay: 100 });
        await page.type('input[placeholder="Password"]', password, { delay: 120 });
        
        // Log In
        await page.click('div[role="button"]');
        
        await page.waitForURL('https://www.threads.net/', { timeout: 60000 });
        
        await context.storageState({ path: this.storagePath });
        console.log(`[Threads] Session saved!`);
      }

    } catch (error) {
      console.error(`[Threads] Login error:`, error);
    } finally {
      await browser.close();
    }
  }

  /**
   * Threads Post Simulation
   */
  async postThreads(caption: string, filePath?: string) {
    const { browser, context } = await this.init();
    const page = await context.newPage();

    try {
      await page.goto('https://www.threads.net/');
      // 1. Click "New thread" or use direct selector
      await page.click('div[role="button"]:has-text("New thread")');
      
      // 2. Add text
      await page.type('div[contenteditable="true"]', caption, { delay: 10 });
      
      // 3. Optional: Add media (click paperclip icon)
      if (filePath) {
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          page.click('svg[aria-label="Add media"]'),
        ]);
        await fileChooser.setFiles(filePath);
      }

      // 4. Post
      await page.click('div[role="button"]:has-text("Post")');
      console.log(`[Threads] Thread posted successfully with Tomiori content.`);
      
    } catch (error) {
       console.error(`[Threads] Post failed:`, error);
    } finally {
       await browser.close();
    }
  }
}
