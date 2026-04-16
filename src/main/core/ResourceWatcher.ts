import { EventEmitter } from 'events';
import { CloudStorageType } from '../../shared/types';
import { driverManager } from '../drivers';
import { FileManagerService, FileItem } from '../services/FileManager';

export interface WatchRule {
  id: string;
  name: string;
  storageType: CloudStorageType;
  accountId?: string;
  folderPath: string;
  enabled: boolean;
  syncTo?: {
    storageType: CloudStorageType;
    accountId?: string;
    targetPath: string;
  }[];
  autoShare?: boolean;
  shareOptions?: {
    password?: string;
    expiresIn?: number;
  };
  checkInterval: number; // 检查间隔（毫秒）
  lastCheckedAt?: Date;
  createdAt: Date;
}

export interface WatchEvent {
  type: 'new' | 'modified' | 'deleted';
  file: FileItem;
  ruleId: string;
  timestamp: Date;
}

export class ResourceWatcher extends EventEmitter {
  private rules: Map<string, WatchRule> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private previousFiles: Map<string, Map<string, FileItem>> = new Map();
  private fileManager: FileManagerService;
  private isRunning = false;

  constructor(fileManager: FileManagerService) {
    super();
    this.fileManager = fileManager;
  }

  addRule(rule: Omit<WatchRule, 'id' | 'createdAt'>): WatchRule {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const fullRule: WatchRule = {
      ...rule,
      id,
      createdAt: new Date()
    };

    this.rules.set(id, fullRule);
    
    if (fullRule.enabled) {
      this.startRule(id);
    }

    return fullRule;
  }

  updateRule(id: string, updates: Partial<Omit<WatchRule, 'id' | 'createdAt'>>): void {
    const rule = this.rules.get(id);
    if (!rule) return;

    const wasEnabled = rule.enabled;
    Object.assign(rule, updates);

    if (updates.enabled !== undefined && updates.enabled !== wasEnabled) {
      if (updates.enabled) {
        this.startRule(id);
      } else {
        this.stopRule(id);
      }
    }
  }

  deleteRule(id: string): boolean {
    this.stopRule(id);
    return this.rules.delete(id);
  }

  getRule(id: string): WatchRule | undefined {
    return this.rules.get(id);
  }

  getRules(): WatchRule[] {
    return Array.from(this.rules.values());
  }

  private startRule(id: string): void {
    const rule = this.rules.get(id);
    if (!rule) return;

    // 初始化文件状态
    this.checkRule(id);

    // 启动定时器
    const timer = setInterval(() => {
      this.checkRule(id);
    }, rule.checkInterval);

    this.timers.set(id, timer);
  }

  private stopRule(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  private async checkRule(id: string): Promise<void> {
    const rule = this.rules.get(id);
    if (!rule) return;

    try {
      // 更新最后检查时间
      rule.lastCheckedAt = new Date();

      // 获取当前文件列表
      const currentFiles = await this.fileManager.listFiles(
        rule.storageType,
        rule.folderPath,
        rule.accountId
      );

      // 获取之前的文件状态
      const prevFiles = this.previousFiles.get(id) || new Map();
      const currentMap = new Map<string, FileItem>();

      for (const file of currentFiles) {
        currentMap.set(file.id, file);

        if (!prevFiles.has(file.id)) {
          // 新文件
          const event: WatchEvent = {
            type: 'new',
            file,
            ruleId: id,
            timestamp: new Date()
          };
          this.emit('change', event);
          this.handleNewFile(rule, file);
        } else {
          const prevFile = prevFiles.get(file.id)!;
          if (prevFile.modifiedAt && file.modifiedAt && file.modifiedAt > prevFile.modifiedAt) {
            // 文件修改
            const event: WatchEvent = {
              type: 'modified',
              file,
              ruleId: id,
              timestamp: new Date()
            };
            this.emit('change', event);
          }
        }
      }

      // 检查删除的文件
      for (const [fileId, prevFile] of prevFiles) {
        if (!currentMap.has(fileId)) {
          const event: WatchEvent = {
            type: 'deleted',
            file: prevFile,
            ruleId: id,
            timestamp: new Date()
          };
          this.emit('change', event);
        }
      }

      // 保存当前状态
      this.previousFiles.set(id, currentMap);

    } catch (error) {
      console.error(`Error checking rule ${id}:`, error);
    }
  }

  private async handleNewFile(rule: WatchRule, file: FileItem): Promise<void> {
    console.log(`New file detected: ${file.name}`);

    // 同步到其他网盘
    if (rule.syncTo && rule.syncTo.length > 0) {
      for (const syncTarget of rule.syncTo) {
        try {
          await this.fileManager.moveFiles(
            [file.path],
            syncTarget.targetPath,
            rule.storageType,
            syncTarget.storageType,
            rule.accountId,
            syncTarget.accountId
          );
          console.log(`Synced ${file.name} to ${syncTarget.storageType}`);
        } catch (error) {
          console.error(`Failed to sync ${file.name}:`, error);
        }
      }
    }

    // 自动生成分享链接
    if (rule.autoShare) {
      try {
        const driver = driverManager.getDriver(rule.storageType);
        const shareUrl = await driver.createShareLink(file.path, rule.shareOptions);
        console.log(`Share link created for ${file.name}: ${shareUrl}`);
        this.emit('share', { file, shareUrl, ruleId: rule.id });
      } catch (error) {
        console.error(`Failed to create share link for ${file.name}:`, error);
      }
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    for (const rule of this.rules.values()) {
      if (rule.enabled) {
        this.startRule(rule.id);
      }
    }

    console.log('Resource watcher started');
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    for (const id of this.timers.keys()) {
      this.stopRule(id);
    }

    console.log('Resource watcher stopped');
  }

  isWatcherRunning(): boolean {
    return this.isRunning;
  }
}
