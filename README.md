# 网盘转存工具

> ⚠️ 旧的 Electron/Vite 入口已废弃。
>
> 当前唯一有效入口是：`server.js + index.html + start.sh`
>
> 请使用：
>
> ```bash
> ./start.sh
> ```
>
> 然后打开：`http://localhost:3000`

一个跨平台的网盘转存工具，当前主运行模式为本地 Web 服务，支持百度网盘、夸克网盘、迅雷网盘的资源自动转存。

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

## 🏃 当前推荐启动方式

```bash
./start.sh
```

或：

```bash
npm start
```

### ⚠️ 废弃说明

以下旧入口已经废弃，不再作为当前调试链路：

```bash
npm run dev
npm run dev:main
npm run dev:renderer
```

## 📦 打包发布

当前仓库的主入口已经切换为 Web 服务模式，因此 Electron 打包链路不再是默认工作流。
如需重新启用 Electron 打包，需要单独整理旧结构后再恢复。

## 📖 使用说明

1. 执行 `./start.sh`
2. 打开 `http://localhost:3000`
3. 先登录目标网盘
4. 输入分享链接并开始转存
5. 查看页面顶部的服务在线状态、commit 版本、登录调试、转存调试
6. 确认真实转存成功后，再继续分享链接提取

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
