import { chromium, Browser, Page } from 'playwright';

export class BrowserManager {
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();

  async launch(): Promise<Browser> {
    if (this.browser) {
      return this.browser;
    }

    this.browser = await chromium.launch({
      headless: false, // 显示浏览器窗口，方便处理验证码
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    return this.browser;
  }

  async getPage(id: string = 'default'): Promise<Page> {
    const browser = await this.launch();
    
    if (this.pages.has(id)) {
      return this.pages.get(id)!;
    }

    const page = await browser.newPage();
    this.pages.set(id, page);
    
    // 设置用户代理（注释掉，避免类型错误）
    // await page.setExtraHTTPHeaders({
    //   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    // });

    return page;
  }

  async closePage(id: string = 'default'): Promise<void> {
    const page = this.pages.get(id);
    if (page) {
      await page.close();
      this.pages.delete(id);
    }
  }

  async close(): Promise<void> {
    for (const page of this.pages.values()) {
      await page.close();
    }
    this.pages.clear();

    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const browserManager = new BrowserManager();
