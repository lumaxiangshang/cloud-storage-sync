import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { browserManager } from './browser';
import { driverManager } from './drivers';
import { CloudStorageType } from '../shared/types';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ==================== IPC 处理 ====================

// 登录网盘
ipcMain.handle('driver:login', async (_, type: CloudStorageType) => {
  try {
    const driver = driverManager.getDriver(type);
    await driver.login();
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '登录失败' };
  }
});

// 检查登录状态
ipcMain.handle('driver:checkLogin', async (_, type: CloudStorageType) => {
  const driver = driverManager.getDriver(type);
  return await driver.isLoggedIn();
});

// 解析分享链接
ipcMain.handle('driver:parseLink', async (_, type: CloudStorageType, url: string) => {
  try {
    const driver = driverManager.getDriver(type);
    const info = await driver.parseShareLink(url);
    return { success: true, data: info };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '解析链接失败' };
  }
});

// 转存文件
ipcMain.handle('driver:saveToDisk', async (_, type: CloudStorageType, url: string) => {
  try {
    const driver = driverManager.getDriver(type);
    const shareInfo = await driver.parseShareLink(url);
    await driver.saveToMyDisk(shareInfo);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '转存失败' };
  }
});

// 生成分享链接
ipcMain.handle('driver:createShare', async (_, type: CloudStorageType, filePath: string) => {
  try {
    const driver = driverManager.getDriver(type);
    const shareUrl = await driver.createShareLink(filePath);
    return { success: true, data: shareUrl };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : '生成分享链接失败' };
  }
});

// ==================== 应用生命周期 ====================

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await browserManager.close();
    app.quit();
  }
});

app.on('before-quit', async () => {
  await browserManager.close();
});
