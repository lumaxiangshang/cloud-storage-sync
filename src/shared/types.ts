// 网盘类型
export type CloudStorageType = 'baidu' | 'quark' | 'xunlei';

// 分享信息
export interface ShareInfo {
  url: string;
  title?: string;
  fileCount?: number;
  totalSize?: string;
  password?: string;
}

// 分享选项
export interface ShareOptions {
  expiresIn?: number; // 有效期（天）
  password?: string;  // 提取码
}

// 转存任务状态
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';

// 转存任务
export interface SyncTask {
  id: string;
  sourceUrl: string;
  sourceType: CloudStorageType;
  targetType: CloudStorageType;
  status: TaskStatus;
  progress: number;
  message: string;
  shareUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 网盘驱动接口
export interface CloudStorageDriver {
  name: string;
  type: CloudStorageType;
  
  // 登录相关
  login(): Promise<void>;
  isLoggedIn(): Promise<boolean>;
  logout(): Promise<void>;
  
  // 分享链接解析
  parseShareLink(url: string): Promise<ShareInfo>;
  
  // 转存文件
  saveToMyDisk(shareInfo: ShareInfo, targetPath?: string): Promise<void>;
  
  // 创建分享链接
  createShareLink(filePath: string, options?: ShareOptions): Promise<string>;
}

// IPC 通信事件
export const IPC_EVENTS = {
  // 任务管理
  TASK_CREATE: 'task:create',
  TASK_LIST: 'task:list',
  TASK_DELETE: 'task:delete',
  TASK_START: 'task:start',
  TASK_STATUS: 'task:status',
  
  // 网盘操作
  DRIVER_LOGIN: 'driver:login',
  DRIVER_CHECK_LOGIN: 'driver:checkLogin',
  DRIVER_PARSE_LINK: 'driver:parseLink',
  DRIVER_SYNC: 'driver:sync',
  DRIVER_CREATE_SHARE: 'driver:createShare',
} as const;
