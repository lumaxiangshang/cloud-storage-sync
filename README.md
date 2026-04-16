# 网盘转存工具

一个跨平台的桌面应用，支持百度网盘、夸克网盘、迅雷网盘的资源自动转存。

## 🚀 功能特性

- ✅ 多网盘支持：百度网盘、夸克网盘、迅雷网盘
- ✅ 自动转存：一键将分享链接转存到自己的网盘
- ✅ 自动分享：转存成功后自动生成分享链接
- ✅ 任务管理：实时查看转存进度和状态
- ✅ 跨平台：支持 Windows、macOS、Linux

## 🛠️ 技术栈

- **前端框架**：React + TypeScript
- **桌面框架**：Electron
- **浏览器自动化**：Playwright
- **样式框架**：Tailwind CSS
- **状态管理**：Zustand

## 📦 安装依赖

```bash
npm install
```

## 🏃 开发模式

```bash
npm run dev
```

## 📦 打包发布

```bash
# 构建
npm run build

# 打包（不安装）
npm run pack

# 生成安装包
npm run dist
```

## 📖 使用说明

1. 启动应用后，先在"网盘登录状态"面板登录需要使用的网盘
2. 在"创建转存任务"面板输入分享链接，选择源网盘和目标网盘
3. 点击"创建任务"
4. 在任务列表中点击"开始转存"
5. 等待转存完成，复制生成的分享链接

## ⚠️ 注意事项

- 首次使用需要在浏览器中手动登录网盘
- 转存过程中请保持网络连接
- 请勿频繁操作，避免被网盘限制

## 📝 项目结构

```
cloud-storage-sync/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── drivers/       # 网盘驱动
│   │   ├── browser.ts     # 浏览器管理
│   │   ├── taskManager.ts # 任务管理
│   │   └── index.ts       # 主进程入口
│   ├── renderer/          # 渲染进程
│   │   ├── components/    # React 组件
│   │   ├── store.ts       # 状态管理
│   │   └── App.tsx        # 主应用
│   └── shared/            # 共享代码
│       └── types.ts       # 类型定义
├── package.json
└── README.md
```

## 🔧 自定义网盘驱动

参考 `src/main/drivers/baidu.ts` 实现 `CloudStorageDriver` 接口，然后在 `src/main/drivers/index.ts` 中注册即可。

## 📄 许可证

MIT
