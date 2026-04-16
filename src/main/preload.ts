import { contextBridge, ipcRenderer } from 'electron';

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 网盘操作
  login: (type: string) => ipcRenderer.invoke('driver:login', type),
  checkLogin: (type: string) => ipcRenderer.invoke('driver:checkLogin', type),
  parseLink: (type: string, url: string) => ipcRenderer.invoke('driver:parseLink', type, url),
  saveToDisk: (type: string, url: string) => ipcRenderer.invoke('driver:saveToDisk', type, url),
  createShare: (type: string, filePath: string) => ipcRenderer.invoke('driver:createShare', type, filePath)
});
