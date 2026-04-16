import { SyncTask, TaskStatus, CloudStorageType, IPC_EVENTS } from '../shared/types';
import { driverManager } from './drivers';
import { ipcMain } from 'electron';

class TaskManager {
  private tasks: Map<string, SyncTask> = new Map();
  private listeners: Map<string, (task: SyncTask) => void> = new Map();

  constructor() {
    this.setupIpcHandlers();
  }

  private setupIpcHandlers() {
    // 创建任务
    ipcMain.handle(IPC_EVENTS.TASK_CREATE, async (_, data: {
      sourceUrl: string;
      sourceType: CloudStorageType;
      targetType: CloudStorageType;
    }) => {
      return this.createTask(data.sourceUrl, data.sourceType, data.targetType);
    });

    // 获取任务列表
    ipcMain.handle(IPC_EVENTS.TASK_LIST, async () => {
      return this.getTasks();
    });

    // 删除任务
    ipcMain.handle(IPC_EVENTS.TASK_DELETE, async (_, taskId: string) => {
      return this.deleteTask(taskId);
    });

    // 开始任务
    ipcMain.handle(IPC_EVENTS.TASK_START, async (_, taskId: string) => {
      return this.startTask(taskId);
    });

    // 网盘登录
    ipcMain.handle(IPC_EVENTS.DRIVER_LOGIN, async (_, type: CloudStorageType) => {
      const driver = driverManager.getDriver(type);
      await driver.login();
      return true;
    });

    // 检查登录状态
    ipcMain.handle(IPC_EVENTS.DRIVER_CHECK_LOGIN, async (_, type: CloudStorageType) => {
      const driver = driverManager.getDriver(type);
      return await driver.isLoggedIn();
    });

    // 解析链接
    ipcMain.handle(IPC_EVENTS.DRIVER_PARSE_LINK, async (_, type: CloudStorageType, url: string) => {
      const driver = driverManager.getDriver(type);
      return await driver.parseShareLink(url);
    });
  }

  createTask(
    sourceUrl: string,
    sourceType: CloudStorageType,
    targetType: CloudStorageType
  ): SyncTask {
    const taskId = Date.now().toString();
    const task: SyncTask = {
      id: taskId,
      sourceUrl,
      sourceType,
      targetType,
      status: 'pending',
      progress: 0,
      message: '等待开始',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tasks.set(taskId, task);
    this.notifyListeners(task);
    return task;
  }

  getTasks(): SyncTask[] {
    return Array.from(this.tasks.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getTask(taskId: string): SyncTask | undefined {
    return this.tasks.get(taskId);
  }

  deleteTask(taskId: string): boolean {
    const success = this.tasks.delete(taskId);
    if (success) {
      const task = this.getTask(taskId);
      if (task) this.notifyListeners(task);
    }
    return success;
  }

  updateTask(taskId: string, updates: Partial<SyncTask>): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    Object.assign(task, updates, { updatedAt: new Date() });
    this.notifyListeners(task);
  }

  async startTask(taskId: string): Promise<void> {
    const task = this.getTask(taskId);
    if (!task) return;

    this.updateTask(taskId, { status: 'running', progress: 0, message: '开始处理...' });

    try {
      // 1. 解析分享链接
      this.updateTask(taskId, { progress: 10, message: '解析分享链接...' });
      const sourceDriver = driverManager.getDriver(task.sourceType);
      const shareInfo = await sourceDriver.parseShareLink(task.sourceUrl);

      // 2. 检查登录状态
      this.updateTask(taskId, { progress: 30, message: '检查登录状态...' });
      const targetDriver = driverManager.getDriver(task.targetType);
      const isLoggedIn = await targetDriver.isLoggedIn();
      
      if (!isLoggedIn) {
        this.updateTask(taskId, { progress: 40, message: '请在浏览器中登录目标网盘...' });
        await targetDriver.login();
      }

      // 3. 转存文件
      this.updateTask(taskId, { progress: 50, message: '正在转存文件...' });
      await targetDriver.saveToMyDisk(shareInfo);

      // 4. 创建分享链接
      this.updateTask(taskId, { progress: 80, message: '生成分享链接...' });
      const shareUrl = await targetDriver.createShareLink('/转存文件');

      // 完成
      this.updateTask(taskId, {
        status: 'success',
        progress: 100,
        message: '转存成功！',
        shareUrl
      });

    } catch (error) {
      this.updateTask(taskId, {
        status: 'failed',
        message: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  addListener(taskId: string, listener: (task: SyncTask) => void): () => void {
    this.listeners.set(taskId, listener);
    return () => this.listeners.delete(taskId);
  }

  private notifyListeners(task: SyncTask): void {
    for (const listener of this.listeners.values()) {
      try {
        listener(task);
      } catch (error) {
        console.error('Listener error:', error);
      }
    }
  }
}

export const taskManager = new TaskManager();
