import { CloudStorageDriver, ShareInfo, ShareOptions, CloudStorageType } from '../../shared/types';
import { browserManager } from '../browser';
import { Page } from 'playwright';

export abstract class BaseDriver implements CloudStorageDriver {
  abstract name: string;
  abstract type: CloudStorageType;
  protected page: Page | null = null;
  protected isLoggedInFlag = false;

  protected async getPage(): Promise<Page> {
    if (!this.page) {
      this.page = await browserManager.getPage(this.type);
    }
    return this.page;
  }

  async login(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async isLoggedIn(): Promise<boolean> {
    return this.isLoggedInFlag;
  }

  async logout(): Promise<void> {
    this.isLoggedInFlag = false;
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
  }

  async parseShareLink(url: string): Promise<ShareInfo> {
    throw new Error('Method not implemented.');
  }

  async saveToMyDisk(shareInfo: ShareInfo, targetPath?: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async createShareLink(filePath: string, options?: ShareOptions): Promise<string> {
    throw new Error('Method not implemented.');
  }

  // 辅助方法：随机延迟
  protected async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
