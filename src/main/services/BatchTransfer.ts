import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';
import csv from 'csv-parser';
import { TaskScheduler, TransferTask } from '../core/TaskScheduler';
import { CloudStorageType } from '../../shared/types';
import { driverManager } from '../drivers';
import { AccountManager } from '../core/AccountManager';

export interface BatchTransferOptions {
  concurrency?: number;
  maxRetries?: number;
  autoSwitchAccount?: boolean;
  targetPath?: string;
}

export class BatchTransferService {
  private scheduler: TaskScheduler;
  private accountManager: AccountManager;

  constructor(accountManager: AccountManager, options?: BatchTransferOptions) {
    this.accountManager = accountManager;
    this.scheduler = new TaskScheduler(options);
  }

  async importFromExcel(filePath: string): Promise<string[]> {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    const urls: string[] = [];
    for (const row of data as any[]) {
      // 尝试从常见列名获取 URL
      const url = row.url || row.link || row.链接 || row[0];
      if (url && typeof url === 'string' && url.startsWith('http')) {
        urls.push(url);
      }
    }

    return urls;
  }

  async importFromCSV(filePath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const urls: string[] = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          const url = row.url || row.link || row.链接 || row[0];
          if (url && typeof url === 'string' && url.startsWith('http')) {
            urls.push(url);
          }
        })
        .on('end', () => resolve(urls))
        .on('error', reject);
    });
  }

  async importFromText(text: string): Promise<string[]> {
    const lines = text.split(/\n|\r\n/);
    const urls: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('http')) {
        urls.push(trimmed);
      }
    }

    return urls;
  }

  async createBatchTasks(
    urls: string[],
    sourceType: CloudStorageType,
    targetType: CloudStorageType,
    options?: {
      sourceAccountId?: string;
      targetAccountId?: string;
      targetPath?: string;
    }
  ): Promise<TransferTask[]> {
    return await this.scheduler.createBatchTasks(
      urls,
      sourceType,
      targetType,
      options
    );
  }

  async startBatch(): Promise<void> {
    const executor = async (
      task: TransferTask,
      updateProgress: (progress: number, message: string) => void
    ): Promise<string> => {
      updateProgress(10, '解析分享链接...');
      
      const sourceDriver = driverManager.getDriver(task.sourceType);
      const shareInfo = await sourceDriver.parseShareLink(task.sourceUrl);
      
      updateProgress(30, '检查登录状态...');
      
      let targetAccountId = task.targetAccountId;
      
      if (!targetAccountId) {
        // 自动选择账号
        const accounts = this.accountManager.getAccountsByType(task.targetType);
        if (accounts.length === 0) {
          throw new Error(`没有可用的${task.targetType}账号`);
        }
        targetAccountId = accounts[0].id;
      }
      
      updateProgress(50, '正在转存文件...');
      
      const targetDriver = driverManager.getDriver(task.targetType);
      await targetDriver.saveToMyDisk(shareInfo, task.targetPath);
      
      updateProgress(80, '生成分享链接...');
      
      const shareUrl = await targetDriver.createShareLink(task.targetPath || '/转存文件');
      
      updateProgress(100, '完成！');
      
      return shareUrl;
    };

    await this.scheduler.startAllTasks(executor);
  }

  getTasks(): TransferTask[] {
    return this.scheduler.getTasks();
  }

  getTask(taskId: string): TransferTask | undefined {
    return this.scheduler.getTask(taskId);
  }

  async exportResults(filePath: string): Promise<void> {
    const tasks = this.getTasks();
    const data = tasks.map(task => ({
      ID: task.id,
      源链接: task.sourceUrl,
      源网盘: task.sourceType,
      目标网盘: task.targetType,
      状态: this.getStatusText(task.status),
      进度: `${task.progress}%`,
      消息: task.message,
      分享链接: task.shareUrl || '',
      创建时间: task.createdAt.toISOString(),
      更新时间: task.updatedAt.toISOString()
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, '转存结果');
    xlsx.writeFile(workbook, filePath);
  }

  private getStatusText(status: string): string {
    const map: Record<string, string> = {
      pending: '等待中',
      running: '处理中',
      success: '成功',
      failed: '失败'
    };
    return map[status] || status;
  }

  pause(): void {
    this.scheduler.pause();
  }

  resume(): void {
    this.scheduler.resume();
  }

  clearTasks(): void {
    this.scheduler.clearTasks();
  }
}
