import { CloudStorageType } from '../../shared/types';
import { driverManager } from '../drivers';
import { AccountManager } from '../core/AccountManager';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modifiedAt?: Date;
  isSelected?: boolean;
}

export interface BatchRenameRule {
  type: 'prefix' | 'suffix' | 'replace' | 'sequence';
  value: string;
  oldValue?: string; // for replace
  startIndex?: number; // for sequence
}

export class FileManagerService {
  private accountManager: AccountManager;

  constructor(accountManager: AccountManager) {
    this.accountManager = accountManager;
  }

  async listFiles(
    storageType: CloudStorageType,
    folderPath: string = '/',
    accountId?: string
  ): Promise<FileItem[]> {
    // TODO: 实际实现需要调用网盘 API 或浏览器自动化
    // 这里返回模拟数据
    
    const mockFiles: FileItem[] = [
      {
        id: '1',
        name: '我的文档',
        path: '/我的文档',
        type: 'folder',
        modifiedAt: new Date()
      },
      {
        id: '2',
        name: '视频教程',
        path: '/视频教程',
        type: 'folder',
        modifiedAt: new Date()
      },
      {
        id: '3',
        name: '重要资料.pdf',
        path: '/重要资料.pdf',
        type: 'file',
        size: 1024 * 1024 * 5, // 5MB
        modifiedAt: new Date()
      },
      {
        id: '4',
        name: '备份文件.zip',
        path: '/备份文件.zip',
        type: 'file',
        size: 1024 * 1024 * 100, // 100MB
        modifiedAt: new Date()
      }
    ];

    return mockFiles;
  }

  async deleteFiles(
    filePaths: string[],
    storageType: CloudStorageType,
    accountId?: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const path of filePaths) {
      try {
        // TODO: 调用网盘删除 API
        console.log(`Deleting: ${path}`);
        success++;
        await new Promise(resolve => setTimeout(resolve, 100)); // 模拟延迟
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  async batchRename(
    files: FileItem[],
    rule: BatchRenameRule,
    storageType: CloudStorageType,
    accountId?: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;
    let index = rule.startIndex || 1;

    for (const file of files) {
      try {
        let newName = file.name;
        const extIndex = file.name.lastIndexOf('.');
        const nameWithoutExt = extIndex > 0 ? file.name.substring(0, extIndex) : file.name;
        const ext = extIndex > 0 ? file.name.substring(extIndex) : '';

        switch (rule.type) {
          case 'prefix':
            newName = rule.value + nameWithoutExt + ext;
            break;
          case 'suffix':
            newName = nameWithoutExt + rule.value + ext;
            break;
          case 'replace':
            newName = nameWithoutExt.replace(rule.oldValue || '', rule.value) + ext;
            break;
          case 'sequence':
            newName = `${rule.value}${index}${ext}`;
            index++;
            break;
        }

        // TODO: 调用网盘重命名 API
        console.log(`Renaming ${file.name} -> ${newName}`);
        success++;
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  async moveFiles(
    filePaths: string[],
    targetFolder: string,
    sourceType: CloudStorageType,
    targetType: CloudStorageType,
    sourceAccountId?: string,
    targetAccountId?: string
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const path of filePaths) {
      try {
        if (sourceType === targetType && sourceAccountId === targetAccountId) {
          // 同网盘内移动
          console.log(`Moving ${path} -> ${targetFolder}`);
        } else {
          // 跨网盘/跨账号移动（先转存再删除）
          console.log(`Transferring ${path} -> ${targetType}:${targetFolder}`);
        }
        success++;
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        failed++;
      }
    }

    return { success, failed };
  }

  async findAdFiles(
    folderPath: string,
    storageType: CloudStorageType,
    keywords: string[] = ['广告', 'AD', '推广', '营销'],
    accountId?: string
  ): Promise<FileItem[]> {
    const files = await this.listFiles(storageType, folderPath, accountId);
    
    return files.filter(file => {
      const name = file.name.toLowerCase();
      return keywords.some(keyword => name.includes(keyword.toLowerCase()));
    });
  }

  async deleteAdFiles(
    folderPath: string,
    storageType: CloudStorageType,
    keywords: string[] = ['广告', 'AD', '推广', '营销'],
    accountId?: string
  ): Promise<{ success: number; failed: number }> {
    const adFiles = await this.findAdFiles(folderPath, storageType, keywords, accountId);
    const paths = adFiles.map(f => f.path);
    return await this.deleteFiles(paths, storageType, accountId);
  }

  formatSize(bytes?: number): string {
    if (!bytes) return '未知';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
