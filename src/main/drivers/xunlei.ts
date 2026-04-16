import { BaseDriver } from './base';
import { ShareInfo, ShareOptions, CloudStorageType } from '../../shared/types';

export class XunleiDriver extends BaseDriver {
  name = '迅雷网盘';
  type: CloudStorageType = 'xunlei';
  private homeUrl = 'https://pan.xunlei.com';

  async login(): Promise<void> {
    const page = await this.getPage();
    
    // 打开迅雷网盘首页
    await page.goto(this.homeUrl, { waitUntil: 'networkidle' });
    
    console.log('请在浏览器中登录迅雷网盘...');
    
    // 等待用户登录
    await page.waitForURL('**/disk/home**', { timeout: 300000 }); // 5分钟超时
    
    this.isLoggedInFlag = true;
    console.log('迅雷网盘登录成功！');
  }

  async parseShareLink(url: string): Promise<ShareInfo> {
    const page = await this.getPage();
    
    // 访问分享链接
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // 检查是否需要提取码
    const needPassword = await page.locator('.access-code-input').isVisible().catch(() => false);
    
    let password: string | undefined;
    if (needPassword) {
      console.log('该链接需要提取码，请在浏览器中输入');
      await page.waitForSelector('.file-list', { timeout: 300000 });
    }
    
    // 获取分享信息
    const title = await page.locator('.share-title').textContent().catch(() => '未知文件');
    const fileCount = await page.locator('.file-item').count().catch(() => 0);
    
    return {
      url,
      title: title || '未知文件',
      fileCount: fileCount || undefined,
      password
    };
  }

  async saveToMyDisk(shareInfo: ShareInfo, targetPath: string = '/转存文件'): Promise<void> {
    const page = await this.getPage();
    
    // 确保在分享页面
    if (!page.url().includes(shareInfo.url)) {
      await page.goto(shareInfo.url, { waitUntil: 'networkidle' });
      await this.randomDelay();
    }
    
    // 全选文件
    const selectAllBtn = page.locator('.select-all');
    if (await selectAllBtn.isVisible()) {
      await selectAllBtn.click();
    }
    
    await this.randomDelay();
    
    // 点击保存按钮
    const saveBtn = page.locator('.save-button');
    await saveBtn.click();
    
    await this.randomDelay();
    
    // 确认保存
    const confirmBtn = page.locator('.confirm-save');
    await confirmBtn.click();
    
    // 等待保存完成
    await page.waitForSelector('.save-success', { timeout: 60000 });
    
    console.log('文件保存成功！');
  }

  async createShareLink(filePath: string, options?: ShareOptions): Promise<string> {
    const page = await this.getPage();
    
    // 打开网盘首页
    await page.goto(this.homeUrl, { waitUntil: 'networkidle' });
    await this.randomDelay();
    
    console.log('请在浏览器中选择要分享的文件');
    
    // 等待用户选择文件并点击分享
    await page.waitForSelector('.share-link', { timeout: 300000 });
    
    // 获取分享链接
    const shareLink = await page.locator('.share-link-input').inputValue();
    
    return shareLink;
  }
}
