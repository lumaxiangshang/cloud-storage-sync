import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { browserManager } from './browser';
import { taskManager } from './taskManager';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  // 开发模式加载 Vite 开发服务器，生产模式加载构建文件
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
    // 关闭浏览器
    await browserManager.close();
    app.quit();
  }
});

app.on('before-quit', async () => {
  // 清理资源
  await browserManager.close();
});

// 安全：防止新窗口创建
app.on('web-contents-created', (_event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    // 可以在这里打开外部浏览器
    console.log('Prevented new window:', url);
    return { action: 'deny' };
  });
});
