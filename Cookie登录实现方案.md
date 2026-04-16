# Cookie 登录 - 实现方案

## 🎯 核心思路

不使用 Playwright 浏览器自动化，而是：
1. **用户手动复制 Cookie**（从浏览器 F12）
2. **保存到本地**（加密存储）
3. **使用 Cookie 调用网盘接口**（直接请求 API）

---

## 📁 网盘接口调研

### 夸克网盘
- 域名：pan.quark.cn
- 主要 Cookie：`__puus`、`p_uid` 等
- 保存接口：POST /api/share/save
- 分享接口：POST /api/file/share

### 百度网盘
- 域名：pan.baidu.com
- 主要 Cookie：`BDUSS`、`STOKEN`
- 保存接口：POST /share/transfer
- 分享接口：POST /share/set

---

## 🔧 实现步骤

### Step 1: Cookie 输入界面
- 文本框粘贴 Cookie
- 自动去除首尾空格
- 解析 Cookie 字符串为对象

### Step 2: Cookie 加密存储
- 使用 AES-256 加密
- 保存到 electron-store

### Step 3: 接口调用
- 使用 fetch/axios 带 Cookie 请求
- 解析分享链接 → 保存 → 分享

---

这个方式比 Playwright 更稳定！
