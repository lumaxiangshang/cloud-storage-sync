import PQueue from 'p-queue';
import { v4 as uuidv4 } from 'uuid';
import { SyncTask, TaskStatus, CloudStorageType } from '../../shared/types';

export interface TransferTask {
  id: string;
  sourceUrl: string;
  sourceType: CloudStorageType;
  sourceAccountId?: string;
  targetType: CloudStorageType;
  targetAccountId?: string;
  targetPath?: string;
  status: TaskStatus;
  progress: number;
  message: string;
  shareUrl?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchTransferOptions {
  concurrency?: number;
  maxRetries?: number;
  autoSwitchAccount?: boolean;
}

export class TaskScheduler {
  private tasks: Map<string, TransferTask> = new Map();
  private queue: PQueue;
  private listeners: Map<string, (task: TransferTask) => void> = new Map();
  private defaultOptions: BatchTransferOptions = {
    concurrency: 3,
    maxRetries: 3,
    autoSwitchAccount: true
  };

  constructor(options?: BatchTransferOptions) {
    const mergedOptions = { ...this.defaultOptions, ...options };
    this.queue = new PQueue({ concurrency: mergedOptions.concurrency });
  }

  createTask(
    sourceUrl: string,
    sourceType: CloudStorageType,
    targetType: CloudStorageType,
    options?: {
      sourceAccountId?: string;
      targetAccountId?: string;
      targetPath?: string;
      maxRetries?: number;
    }
  ): TransferTask {
    const task: TransferTask = {
      id: uuidv4(),
      sourceUrl,
      sourceType,
      sourceAccountId: options?.sourceAccountId,
      targetType,
      targetAccountId: options?.targetAccountId,
      targetPath: options?.targetPath,
      status: 'pending',
      progress: 0,
      message: '等待中',
      retryCount: 0,
      maxRetries: options?.maxRetries ?? this.defaultOptions.maxRetries!,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(task.id, task);
    this.notifyListeners(task);
    return task;
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
    const tasks: TransferTask[] = [];

    for (const url of urls) {
      const task = this.createTask(url, sourceType, targetType, options);
      tasks.push(task);
    }

    return tasks;
  }

  async startTask(
    taskId: string,
    executor: (task: TransferTask, updateProgress: (progress: number, message: string) => void) => Promise<string>
  ): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    this.queue.add(async () => {
      await this.executeTask(task, executor);
    });
  }

  async startAllTasks(
    executor: (task: TransferTask, updateProgress: (progress: number, message: string) => void) => Promise<string>
  ): Promise<void> {
    const pendingTasks = this.getTasks().filter(t => t.status === 'pending');

    for (const task of pendingTasks) {
      this.queue.add(async () => {
        await this.executeTask(task, executor);
      });
    }
  }

  private async executeTask(
    task: TransferTask,
    executor: (task: TransferTask, updateProgress: (progress: number, message: string) => void) => Promise<string>
  ): Promise<void> {
    this.updateTask(task.id, { status: 'running', progress: 0, message: '开始处理...' });

    const updateProgress = (progress: number, message: string) => {
      this.updateTask(task.id, { progress, message });
    };

    try {
      const shareUrl = await executor(task, updateProgress);
      
      this.updateTask(task.id, {
        status: 'success',
        progress: 100,
        message: '转存成功！',
        shareUrl
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      if (task.retryCount < task.maxRetries) {
        // 重试
        this.updateTask(task.id, {
          retryCount: task.retryCount + 1,
          message: `失败，正在重试 (${task.retryCount + 1}/${task.maxRetries})...`
        });
        
        // 延迟后重试
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.executeTask(task, executor);
      } else {
        // 达到最大重试次数，标记失败
        this.updateTask(task.id, {
          status: 'failed',
          message: `失败: ${errorMessage}`,
          error: errorMessage
        });
      }
    }
  }

  updateTask(taskId: string, updates: Partial<TransferTask>): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    Object.assign(task, updates, { updatedAt: new Date() });
    this.notifyListeners(task);
  }

  getTask(taskId: string): TransferTask | undefined {
    return this.tasks.get(taskId);
  }

  getTasks(): TransferTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getTasksByStatus(status: TaskStatus): TransferTask[] {
    return this.getTasks().filter(t => t.status === status);
  }

  deleteTask(taskId: string): boolean {
    return this.tasks.delete(taskId);
  }

  clearTasks(): void {
    this.tasks.clear();
  }

  pause(): void {
    this.queue.pause();
  }

  resume(): void {
    this.queue.start();
  }

  getQueueSize(): number {
    return this.queue.size + this.queue.pending;
  }

  addListener(taskId: string, listener: (task: TransferTask) => void): () => void {
    this.listeners.set(taskId, listener);
    return () => this.listeners.delete(taskId);
  }

  private notifyListeners(task: TransferTask): void {
    for (const listener of this.listeners.values()) {
      try {
        listener(task);
      } catch (error) {
        console.error('Listener error:', error);
      }
    }
  }
}
