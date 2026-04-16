import { create } from 'zustand';
import { SyncTask, CloudStorageType } from '../shared/types';
import { ipcRenderer } from 'electron';
import { IPC_EVENTS } from '../shared/types';

interface AppState {
  tasks: SyncTask[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  createTask: (sourceUrl: string, sourceType: CloudStorageType, targetType: CloudStorageType) => Promise<void>;
  startTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  loginDriver: (type: CloudStorageType) => Promise<boolean>;
  checkLogin: (type: CloudStorageType) => Promise<boolean>;
  parseLink: (type: CloudStorageType, url: string) => Promise<any>;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await ipcRenderer.invoke(IPC_EVENTS.TASK_LIST);
      set({ tasks });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '获取任务失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  createTask: async (sourceUrl: string, sourceType: CloudStorageType, targetType: CloudStorageType) => {
    set({ isLoading: true, error: null });
    try {
      await ipcRenderer.invoke(IPC_EVENTS.TASK_CREATE, { sourceUrl, sourceType, targetType });
      await get().fetchTasks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '创建任务失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  startTask: async (taskId: string) => {
    set({ error: null });
    try {
      await ipcRenderer.invoke(IPC_EVENTS.TASK_START, taskId);
      await get().fetchTasks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '启动任务失败' });
    }
  },

  deleteTask: async (taskId: string) => {
    set({ error: null });
    try {
      await ipcRenderer.invoke(IPC_EVENTS.TASK_DELETE, taskId);
      await get().fetchTasks();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '删除任务失败' });
    }
  },

  loginDriver: async (type: CloudStorageType) => {
    set({ error: null });
    try {
      await ipcRenderer.invoke(IPC_EVENTS.DRIVER_LOGIN, type);
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '登录失败' });
      return false;
    }
  },

  checkLogin: async (type: CloudStorageType) => {
    try {
      return await ipcRenderer.invoke(IPC_EVENTS.DRIVER_CHECK_LOGIN, type);
    } catch (error) {
      return false;
    }
  },

  parseLink: async (type: CloudStorageType, url: string) => {
    set({ error: null });
    try {
      return await ipcRenderer.invoke(IPC_EVENTS.DRIVER_PARSE_LINK, type, url);
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '解析链接失败' });
      throw error;
    }
  },

  clearError: () => set({ error: null })
}));
