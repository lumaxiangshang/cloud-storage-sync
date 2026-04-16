import { BaseDriver } from './base';
import { ShareInfo, ShareOptions, CloudStorageType } from '../../shared/types';

export class BaiduDriver extends BaseDriver {
  name = '百度网盘';
  type: CloudStorageType = 'baidu';
  
  // 百度网盘 URLs
  private loginUrl = 'https://pan.baidu.com';
  private homeUrl = 'https://pan.baidu.com/disk/home';

  async login(): Promise<void> {
    const page = await this.getPage();
    
    console.log('正在打开百度网盘登录页面...');
    
    // 打开百度网盘首页
    await page.goto(this.loginUrl, { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // 等待用户手动登录
    console.log('请在浏览器中登录百度网盘（扫码或账号密码）');
    
    // 等待跳转到网盘首页，表示登录成功
    try {
      await page.waitForURL('**/disk/home**', { timeout: 300000 }); // 5分钟超时
      this.isLoggedInFlag = true;
      console.log('✅ 百度网盘登录成功！');
    } catch (error) {
      throw new Error('登录超时，请重试');
    }
  }

  async parseShareLink(url: string): Promise<ShareInfo> {
    const page = await this.getPage();
    
    console.log('正在解析分享链接:', url);
    
    // 访问分享链接
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    await this.randomDelay(1000, 2000);
    
    // 检查是否需要提取码
    const hasPassword = await page.locator('.pw-input, .access-code, [placeholder*="提取码"], [placeholder*="密码"]').first().isVisible().catch(() => false);
    
    if (hasPassword) {
      console.log('该分享链接需要提取码，请在浏览器中输入');
      // 等待用户输入提取码并进入
      await page.waitForSelector('.file-list, .wp-s-core-pan, [data-testid*="file"], .nd-file-list', { timeout: 300000 });
    }
    
    // 获取分享标题
    let title = '未知文件';
    try {
      title = await page.locator('.share-title, .filename, h1, [class*="title"]').first().textContent() || '未知文件';
    } catch (e) {
      console.log('获取标题失败，使用默认值');
    }
    
    // 获取文件数量
    let fileCount: number | undefined;
    try {
      const listItems = await page.locator('.file-item, .wp-s-file-item, [data-testid*="file-item"], .nd-file-item').count();
      if (listItems > 0) {
        fileCount = listItems;
      }
    } catch (e) {
      console.log('获取文件数量失败');
    }
    
    console.log('分享信息解析完成:', { title, fileCount });
    
    return {
      url,
      title: title.trim(),
      fileCount
    };
  }

  async saveToMyDisk(shareInfo: ShareInfo, targetPath: string = '/我的转存'): Promise<void> {
    const page = await this.getPage();
    
    console.log('正在转存文件到我的网盘...');
    
    // 确保在分享页面
    if (!page.url().includes(shareInfo.url)) {
      await page.goto(shareInfo.url, { waitUntil: 'networkidle' });
      await this.randomDelay(1500, 2500);
    }
    
    // 尝试各种选择器来点击"保存到网盘"按钮
    const saveSelectors = [
      '.save-button',
      '.save-to-cloud',
      '[data-button-id*="save"]',
      '.g-button[aria-label*="保存"], .g-button[title*="保存"]',
      'button:has-text("保存到网盘"), button:has-text("转存")',
      '.wp-s-btn-save',
      '.nd-main-btn-save'
    ];
    
    let saveClicked = false;
    for (const selector of saveSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 2000 })) {
          await btn.click();
          saveClicked = true;
          console.log('点击保存按钮成功');
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!saveClicked) {
      throw new Error('未找到保存按钮，请手动保存或检查页面');
    }
    
    await this.randomDelay(1500, 3000);
    
    // 尝试点击确认按钮（保存到网盘弹窗）
    const confirmSelectors = [
      '.dialog-footer .confirm, .dialog-footer button:last-child',
      '.g-button-primary',
      'button:has-text("确定"), button:has-text("保存")',
      '.wp-s-btn-confirm'
    ];
    
    for (const selector of confirmSelectors) {
      try {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 3000 })) {
          await btn.click();
          console.log('点击确认按钮成功');
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    // 等待保存成功提示
    await this.randomDelay(2000, 4000);
    
    console.log('✅ 文件转存成功！');
  }

  async createShareLink(filePath: string, options?: ShareOptions): Promise<string> {
    const page = await this.getPage();
    
    console.log('正在生成分享链接...');
    
    // 打开网盘首页
    await page.goto(this.homeUrl, { waitUntil: 'networkidle' });
    await this.randomDelay(2000, 3000);
    
    console.log('请在浏览器中选择文件并点击分享，然后复制分享链接');
    
    // 简单实现：等待用户手动操作，后续可完善为自动
    // 这里返回一个占位，实际应用中用户手动复制链接
    await page.waitForTimeout(10000);
    
    throw new Error('请在浏览器中手动生成分享链接并复制');
  }
}
