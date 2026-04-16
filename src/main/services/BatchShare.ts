import * as xlsx from 'xlsx';
import { CloudStorageType } from '../../shared/types';
import { driverManager } from '../drivers';
import { AccountManager } from '../core/AccountManager';

export interface ShareTask {
  id: string;
  filePath: string;
  storageType: CloudStorageType;
  accountId?: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  shareUrl?: string;
  password?: string;
  expiresIn?: number; // 有效期（天）
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchShareOptions {
  password?: string;
  expiresIn?: number; // 有效期（天），0 表示永久
  traverseSubfolders?: boolean; // 是否遍历子文件夹
}

export class BatchShareService {
  private tasks: Map<string, ShareTask> = new Map();
  private accountManager: AccountManager;

  constructor(accountManager: AccountManager) {
    this.accountManager = accountManager;
  }

  createTask(
    filePath: string,
    storageType: CloudStorageType,
    options?: {
      accountId?: string;
      password?: string;
      expiresIn?: number;
    }
  ): ShareTask {
    const task: ShareTask = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      filePath,
      storageType,
      accountId: options?.accountId,
      status: 'pending',
      password: options?.password,
      expiresIn: options?.expiresIn,
      message: '等待中',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(task.id, task);
    return task;
  }

  createBatchTasks(
    filePaths: string[],
    storageType: CloudStorageType,
    options?: {
      accountId?: string;
      password?: string;
      expiresIn?: number;
    }
  ): ShareTask[] {
    return filePaths.map(path => this.createTask(path, storageType, options));
  }

  async startTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    this.updateTask(taskId, { status: 'running', message: '正在生成分享链接...' });

    try {
      const driver = driverManager.getDriver(task.storageType);
      const shareUrl = await driver.createShareLink(task.filePath, {
        password: task.password,
        expiresIn: task.expiresIn
      });

      this.updateTask(taskId, {
        status: 'success',
        shareUrl,
        message: '分享链接生成成功！'
      });
    } catch (error) {
      this.updateTask(taskId, {
        status: 'failed',
        message: error instanceof Error ? error.message : '生成失败'
      });
    }
  }

  async startAllTasks(): Promise<void> {
    const pendingTasks = this.getTasks().filter(t => t.status === 'pending');

    for (const task of pendingTasks) {
      await this.startTask(task.id);
      // 延迟避免频繁请求
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  updateTask(taskId: string, updates: Partial<ShareTask>): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    Object.assign(task, updates, { updatedAt: new Date() });
  }

  getTask(taskId: string): ShareTask | undefined {
    return this.tasks.get(taskId);
  }

  getTasks(): ShareTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  clearTasks(): void {
    this.tasks.clear();
  }

  async exportResults(filePath: string): Promise<void> {
    const tasks = this.getTasks();
    const data = tasks.map(task => ({
      ID: task.id,
      文件路径: task.filePath,
      网盘类型: task.storageType,
      状态: this.getStatusText(task.status),
      分享链接: task.shareUrl || '',
      提取码: task.password || '',
      有效期: task.expiresIn ? `${task.expiresIn} 天` : '永久',
      消息: task.message,
      创建时间: task.createdAt.toISOString(),
      更新时间: task.updatedAt.toISOString()
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, '分享结果');
    xlsx.writeFile(workbook, filePath);
  }

  generatePassword(length: number = 4): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
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
}
