const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const fs = require('fs');

const browserContexts = new Map();
const sessions = new Map();
const SESSION_STORE_PATH = path.join(__dirname, 'runtime-sessions.json');

const STORAGE_CONFIG = {
  baidu: {
    name: '百度网盘',
    homeUrl: 'https://pan.baidu.com/',
    loginCheck: [
      '.wp-s-header__avatar',
      '.nd-avatar',
      '[class*="avatar"]',
      'text=退出登录',
      'text=我的文件'
    ],
    saveButtons: ['text=保存到网盘', 'text=保存', '.g-button', 'button:has-text("转存")'],
    confirmButtons: ['text=确定', 'text=确认', 'button:has-text("保存")'],
    shareButtons: ['text=分享', 'button:has-text("分享")', '[aria-label*="分享"]'],
    copyButtons: ['text=复制链接', 'text=复制', 'button:has-text("复制链接")'],
    linkPatterns: [/https:\/\/pan\.baidu\.com\/[\S]+/i]
  },
  quark: {
    name: '夸克网盘',
    homeUrl: 'https://pan.quark.cn/',
    loginCheck: [
      'text=最近',
      'text=文件',
      'text=回收站',
      '[class*="avatar"]',
      '[class*="user"]'
    ],
    saveButtons: [
      'text=保存到网盘',
      'text=保存',
      'text=转存',
      'button:has-text("转存")',
      'button:has-text("存到网盘")',
      'button:has-text("立即保存")',
      '[class*="save"]',
      '[class*="transfer"]'
    ],
    moreButtons: ['text=更多', 'button:has-text("更多")', '[class*="more"]'],
    confirmButtons: ['text=确定', 'text=确认', 'button:has-text("保存")'],
    shareButtons: ['text=分享', 'button:has-text("分享")', 'button:has-text("立即分享")'],
    copyButtons: ['text=复制链接', 'text=复制', 'button:has-text("复制全部")'],
    linkPatterns: [/https:\/\/pan\.quark\.cn\/[\S]+/i]
  },
  xunlei: {
    name: '迅雷网盘',
    homeUrl: 'https://pan.xunlei.com/',
    loginCheck: [
      'text=云盘',
      'text=最近',
      '[class*="avatar"]',
      '[class*="user"]'
    ],
    saveButtons: ['text=保存到网盘', 'text=保存', 'button:has-text("转存")'],
    confirmButtons: ['text=确定', 'text=确认', 'button:has-text("保存")'],
    shareButtons: ['text=分享', 'button:has-text("分享")'],
    copyButtons: ['text=复制链接', 'text=复制'],
    linkPatterns: [/https:\/\/pan\.xunlei\.com\/[\S]+/i]
  }
};

function sanitizeSession(session) {
  const copy = { ...session };
  delete copy.mainPage;
  delete copy.transferPage;
  delete copy.sharePage;
  return copy;
}

function persistSessions() {
  try {
    const data = Object.fromEntries(
      Array.from(sessions.entries()).map(([key, value]) => [key, sanitizeSession(value)])
    );
    fs.writeFileSync(SESSION_STORE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Persist sessions failed:', error.message);
  }
}

function loadPersistedSessions() {
  try {
    if (!fs.existsSync(SESSION_STORE_PATH)) return;
    const raw = fs.readFileSync(SESSION_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    for (const [key, value] of Object.entries(parsed)) {
      sessions.set(key, value);
    }
  } catch (error) {
    console.error('Load sessions failed:', error.message);
  }
}

function ensureSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      status: 'idle',
      phase: 'idle',
      storageType: null,
      isLoggedIn: false,
      message: '等待开始',
      shareUrl: '',
      shareResult: '',
      transferCompleted: false,
      lastUpdatedAt: Date.now(),
      logs: []
    });
    persistSessions();
  }
  return sessions.get(sessionId);
}

function appendLog(session, message) {
  session.logs = session.logs || [];
  session.logs.push(`[${new Date().toLocaleTimeString('zh-CN', { hour12: false })}] ${message}`);
  if (session.logs.length > 50) session.logs = session.logs.slice(-50);
  session.lastUpdatedAt = Date.now();
  persistSessions();
}

function updateSession(sessionId, patch) {
  const session = ensureSession(sessionId);
  Object.assign(session, patch, { lastUpdatedAt: Date.now() });
  persistSessions();
  return session;
}

function maskCookieValue(value = '') {
  if (!value) return '';
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

async function getSessionCookieSummary(sessionId) {
  const bundle = browserContexts.get(sessionId);
  if (!bundle) return [];
  const cookies = await bundle.context.cookies().catch(() => []);
  return cookies.map((cookie) => ({
    name: cookie.name,
    domain: cookie.domain,
    path: cookie.path,
    expires: cookie.expires,
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    valuePreview: maskCookieValue(cookie.value)
  }));
}

async function initBrowser() {
  const headless = process.env.HEADLESS !== 'false';
  return chromium.launch({
    headless,
    slowMo: headless ? 0 : 150
  });
}

async function getBrowserContext(sessionId) {
  if (browserContexts.has(sessionId)) return browserContexts.get(sessionId);

  const browser = await initBrowser();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  });

  const session = ensureSession(sessionId);
  appendLog(session, '已创建浏览器上下文');

  const bundle = { browser, context };
  browserContexts.set(sessionId, bundle);
  return bundle;
}

async function getOrCreatePage(sessionId, pageKey = 'mainPage') {
  const bundle = await getBrowserContext(sessionId);
  const session = ensureSession(sessionId);
  if (!session[pageKey] || session[pageKey].isClosed()) {
    session[pageKey] = await bundle.context.newPage();
  }
  return session[pageKey];
}

async function safeClick(page, selectors, timeout = 3000) {
  for (const selector of selectors) {
    try {
      await page.locator(selector).first().click({ timeout });
      return selector;
    } catch {}
  }
  return null;
}

async function safeClickByText(page, texts, session, options = {}) {
  const clicked = await page.evaluate(({ texts, exact }) => {
    const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const matches = [];
    const nodes = Array.from(document.querySelectorAll('button, a, div, span, p'));
    for (const node of nodes) {
      const text = norm(node.textContent);
      if (!text) continue;
      const ok = texts.some((t) => exact ? text === t : text.includes(t));
      if (!ok) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) continue;
      matches.push({ text, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    }
    const target = matches[0];
    if (!target) return null;
    const el = document.elementFromPoint(target.x, target.y);
    if (el) el.click();
    return target.text;
  }, { texts, exact: Boolean(options.exact) }).catch(() => null);

  if (clicked && session) appendLog(session, `通过文本命中点击节点: ${clicked}`);
  return clicked;
}

async function collectVisibleTexts(page, limit = 80) {
  return page.locator('button, a, span, div').evaluateAll((nodes, max) => {
    return nodes
      .map((node) => (node.textContent || '').trim())
      .filter(Boolean)
      .filter((text, index, arr) => arr.indexOf(text) === index)
      .slice(0, max);
  }, limit).catch(() => []);
}

async function selectSharedFileItem(page, fileName, session) {
  const candidates = [];
  const normalized = normalizeFileName(fileName);
  if (normalized) {
    candidates.push(`text=${normalized}`);
    const shortName = normalized.replace(/^上传到当前目录/, '').trim();
    if (shortName && shortName !== normalized) candidates.push(`text=${shortName}`);
  }
  candidates.push('text=01 王海侠—捕捉0-6岁敏感期·培养孩子心智全面发展');

  for (const selector of candidates) {
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: 'visible', timeout: 1500 });
      await locator.click({ timeout: 1500 });
      await page.waitForTimeout(1000);
      appendLog(session, `已选中分享页文件项: ${selector}`);
      return { selected: true, selector };
    } catch {}
  }

  appendLog(session, '未能在分享页选中文件项');
  return { selected: false };
}

async function detectLoggedIn(page, storageType) {
  const config = STORAGE_CONFIG[storageType];
  for (const selector of config.loginCheck) {
    try {
      await page.locator(selector).first().waitFor({ state: 'visible', timeout: 1500 });
      return { loggedIn: true, method: 'selector', evidence: selector };
    } catch {}
  }
  return { loggedIn: false, method: 'selector', evidence: null };
}

async function verifyLoginState(sessionId, storageType) {
  const page = await getOrCreatePage(sessionId, 'mainPage');
  const config = STORAGE_CONFIG[storageType];
  await page.goto(config.homeUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1800);

  const selectorCheck = await detectLoggedIn(page, storageType);
  const cookies = await getSessionCookieSummary(sessionId);
  const cookieNames = cookies.map((item) => item.name.toLowerCase());
  const hasRelevantCookie = storageType === 'quark'
    ? cookieNames.some((name) => /token|sid|sess|cookie|us/.test(name))
    : cookies.length > 0;

  const title = await page.title().catch(() => '');
  const url = page.url();
  const visibleTexts = await collectVisibleTexts(page, 40);

  return {
    loggedIn: Boolean(selectorCheck.loggedIn && hasRelevantCookie),
    selectorCheck,
    hasRelevantCookie,
    cookieCount: cookies.length,
    cookies,
    title,
    url,
    visibleTexts
  };
}

function validateShareUrl(url, storageType) {
  const config = STORAGE_CONFIG[storageType];
  return config.linkPatterns.some((pattern) => pattern.test(url));
}

function normalizeFileName(name = '') {
  return String(name)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractShareLink(page, storageType) {
  const patterns = STORAGE_CONFIG[storageType]?.linkPatterns || [/https?:\/\//i];
  const values = await page.locator('input, textarea, a, span, div').evaluateAll((nodes) => {
    const items = [];
    for (const node of nodes) {
      const parts = [node.value, node.href, node.textContent];
      for (const part of parts) {
        if (typeof part === 'string' && /https?:\/\//i.test(part)) {
          items.push(part.trim());
        }
      }
    }
    return items;
  }).catch(() => []);

  const unique = Array.from(new Set(values.map((item) => item.replace(/\s+/g, ' ').trim())));
  return unique.find((item) => patterns.some((pattern) => pattern.test(item))) || unique[0] || '';
}

async function extractSharedFileName(page) {
  const rejectPattern = /^(全部文件|最近|分享|下载|登录|夸克网盘|保存到网盘|首页|文件|更多|用户|我的网盘|夸克网盘分享|查看|打开目录|前往网盘)$/;
  const selectors = [
    '[class*="filename"]',
    '[class*="file-name"]',
    '[class*="resource"] [class*="title"]',
    '[class*="detail"] [class*="title"]',
    '[class*="header"] [class*="title"]',
    'h1',
    'h2',
    '.name',
    '.file-name'
  ];

  for (const selector of selectors) {
    try {
      const texts = await page.locator(selector).evaluateAll((nodes) =>
        nodes.map((node) => (node.textContent || '').trim()).filter(Boolean)
      );
      for (const raw of texts) {
        const text = normalizeFileName(raw);
        if (!text || rejectPattern.test(text)) continue;
        if (/保存到网盘|分享|下载|登录|夸克网盘/.test(text) && text.length < 12) continue;
        return text;
      }
    } catch {}
  }

  return '';
}

async function parseTransferSuccessContext(page, session) {
  const openSelectors = [
    'text=查看文件',
    'text=打开目录',
    'text=前往网盘',
    'text=查看',
    'button:has-text("查看文件")',
    'button:has-text("前往网盘")'
  ];
  const successTexts = ['保存成功', '已保存到网盘', '转存成功', '已添加到网盘'];

  for (const text of successTexts) {
    try {
      await page.locator(`text=${text}`).first().waitFor({ state: 'visible', timeout: 1200 });
      appendLog(session, `发现转存成功提示: ${text}`);
      return { found: true, verified: true, source: 'success_text', text };
    } catch {}
  }

  for (const selector of openSelectors) {
    try {
      const locator = page.locator(selector).first();
      await locator.waitFor({ state: 'visible', timeout: 1200 });
      appendLog(session, `发现成功页入口: ${selector}`);
      return { found: true, verified: false, source: 'open_entry', selector };
    } catch {}
  }

  appendLog(session, '未发现可验证的转存成功信号');
  return { found: false, verified: false };
}

async function openTransferredTarget(page, session) {
  const openSelectors = [
    'text=查看文件',
    'text=打开目录',
    'text=前往网盘',
    'text=查看',
    'button:has-text("查看文件")',
    'button:has-text("前往网盘")'
  ];

  for (const selector of openSelectors) {
    try {
      const beforeUrl = page.url();
      const beforeTitle = await page.title().catch(() => '');
      const locator = page.locator(selector).first();
      await locator.click({ timeout: 1500 });
      await page.waitForTimeout(2500);
      const afterUrl = page.url();
      const afterTitle = await page.title().catch(() => '');
      const changed = beforeUrl !== afterUrl || beforeTitle !== afterTitle;
      appendLog(session, `点击成功页入口后状态: selector=${selector}, urlChanged=${beforeUrl !== afterUrl}, titleChanged=${beforeTitle !== afterTitle}`);
      if (changed) {
        appendLog(session, `已通过成功页入口跳转: ${selector}`);
        return { opened: true, selector, beforeUrl, afterUrl, beforeTitle, afterTitle };
      }
      appendLog(session, `成功页入口未触发有效跳转: ${selector}`);
    } catch {
      appendLog(session, `成功页入口点击失败: ${selector}`);
    }
  }

  return { opened: false };
}

async function detectQuarkSaveControls(page, session) {
  const controls = await page.evaluate(() => {
    const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const nodes = Array.from(document.querySelectorAll('button, a, div, span'));
    return nodes
      .map((node) => ({
        text: norm(node.textContent),
        cls: node.className || '',
        role: node.getAttribute('role') || '',
        title: node.getAttribute('title') || ''
      }))
      .filter((item) => item.text)
      .filter((item) => /保存|转存|网盘|目录|全部文件|上传到/.test(item.text))
      .slice(0, 80);
  }).catch(() => []);
  appendLog(session, `转存候选控件: ${controls.map(item => item.text).join(' | ').slice(0, 400)}`);
  return controls;
}

async function triggerQuarkTransfer(page, session, detectedFileName) {
  const selectedItem = await selectSharedFileItem(page, detectedFileName || '', session);
  await page.waitForTimeout(800);

  let clicked = await safeClick(page, STORAGE_CONFIG.quark.saveButtons, 2500);
  if (clicked) return { clicked, selectedItem, method: 'selector' };

  const fallbackTexts = ['保存到网盘', '立即保存', '存到网盘', '转存'];
  clicked = await safeClickByText(page, fallbackTexts, session);
  if (clicked) {
    await page.waitForTimeout(1000);
    return { clicked, selectedItem, method: 'text' };
  }

  await detectQuarkSaveControls(page, session);
  return { clicked: null, selectedItem, method: 'none' };
}

async function locateFileInDrive(page, fileName, session, options = {}) {
  const normalized = normalizeFileName(fileName);
  if (!normalized) return { found: false, reason: 'empty_name' };

  appendLog(session, `开始定位网盘文件: ${normalized}`);

  const candidateNames = Array.from(new Set([
    normalized,
    normalized.replace(/^上传到当前目录/, '').trim(),
    normalized.replace(/^上传到同级目录/, '').trim(),
    normalized.split(/[·\-|｜]/)[0].trim()
  ].filter(Boolean)));

  const searchSelectors = [
    'input[placeholder*="搜索"]',
    'input[placeholder*="文件"]',
    'input[type="search"]',
    '[contenteditable="true"]'
  ];

  for (const keyword of candidateNames) {
    for (const selector of searchSelectors) {
      try {
        appendLog(session, `尝试搜索框: ${selector} -> ${keyword}`);
        const input = page.locator(selector).first();
        await input.click({ timeout: 1200 });
        await input.fill ? await input.fill('') : await page.keyboard.press('Control+A').catch(() => {});
        if (input.fill) {
          await input.fill(keyword, { timeout: 1500 });
        } else {
          await page.keyboard.type(keyword, { delay: 50 });
        }
        await page.keyboard.press('Enter').catch(() => {});
        await page.waitForTimeout(1800);
        appendLog(session, `已执行搜索: ${keyword}`);
        break;
      } catch {
        appendLog(session, `搜索框不可用: ${selector}`);
      }
    }

    const rowSelectors = [
      `text=${keyword}`,
      `text=${keyword.slice(0, Math.min(keyword.length, 18))}`,
      `[title="${keyword.replace(/"/g, '\\"')}"]`,
      `[aria-label*="${keyword.replace(/"/g, '\\"')}"]`
    ];

    for (const selector of rowSelectors) {
      try {
        appendLog(session, `尝试定位文件节点: ${selector}`);
        const target = page.locator(selector).first();
        await target.waitFor({ state: 'visible', timeout: 1800 });
        if (!options.verifyOnly) {
          await target.click({ timeout: 1800 });
          await page.waitForTimeout(1000);
        }
        return { found: true, selector, matchedName: keyword };
      } catch {
        appendLog(session, `未命中文件节点: ${selector}`);
      }
    }
  }

  return { found: false, reason: 'file_not_found' };
}

async function tryShareFlow(page, config, storageType, session) {
  const shareClicked = await safeClick(page, config.shareButtons, 2500);
  if (!shareClicked) return { ok: false, stage: 'share_button' };

  await page.waitForTimeout(2000);
  await safeClick(page, ['text=全部', 'text=公开', 'text=创建链接', 'button:has-text("创建分享")'], 1500);
  const copyClicked = await safeClick(page, config.copyButtons, 2500);
  await page.waitForTimeout(1200);
  const shareResult = await extractShareLink(page, storageType);
  if (!shareResult) {
    const visibleTexts = await collectVisibleTexts(page, 50);
    appendLog(session, `分享弹层中未抓到链接，可见文本: ${visibleTexts.join(' | ').slice(0, 300)}`);
  }
  return { ok: Boolean(shareResult), shareClicked, copyClicked, shareResult };
}

app.get('/api/status', async (req, res) => {
  const { sessionId } = req.query;
  const session = ensureSession(sessionId);

  if (session.storageType && browserContexts.has(sessionId) && session.mainPage && !session.mainPage.isClosed()) {
    try {
      const loginState = await verifyLoginState(sessionId, session.storageType);
      session.isLoggedIn = loginState.loggedIn;
      session.loginState = loginState;
    } catch {}
  }

  res.json({ success: true, session });
});

app.post('/api/login', async (req, res) => {
  try {
    const { storageType, sessionId } = req.body;
    const config = STORAGE_CONFIG[storageType];
    if (!config) return res.status(400).json({ success: false, error: '不支持的网盘类型' });

    const session = updateSession(sessionId, {
      status: 'waiting_login',
      phase: 'login',
      storageType,
      message: `正在打开${config.name}登录页...`,
      transferCompleted: false,
      shareResult: ''
    });

    const page = await getOrCreatePage(sessionId);
    await page.goto(config.homeUrl, { waitUntil: 'domcontentloaded' });
    appendLog(session, `已打开 ${config.name} 首页`);

    const pollLoginState = async (attempt = 1) => {
      try {
        const loginState = await verifyLoginState(sessionId, storageType);
        updateSession(sessionId, {
          isLoggedIn: loginState.loggedIn,
          loginState,
          status: loginState.loggedIn ? 'ready_for_transfer' : 'waiting_login',
          phase: 'login',
          message: loginState.loggedIn
            ? `${config.name} 已检测到真实登录，可以继续转存`
            : `正在等待${config.name}登录完成，已自动校验 ${attempt} 次`
        });
        appendLog(session, loginState.loggedIn
          ? `自动校验登录成功，selector=${loginState.selectorCheck?.evidence || 'none'}, cookie=${loginState.cookieCount}`
          : `自动校验登录未完成，第${attempt}次，selector=${loginState.selectorCheck?.evidence || 'none'}, cookie=${loginState.cookieCount}`);

        if (!loginState.loggedIn && attempt < 10) {
          setTimeout(() => pollLoginState(attempt + 1), 2500);
        }
      } catch (error) {
        appendLog(session, `登录检测失败: ${error.message}`);
      }
    };

    setTimeout(() => pollLoginState(1), 1500);

    res.json({
      success: true,
      message: `浏览器已打开，请登录${config.name}`,
      session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/check-login', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = ensureSession(sessionId);
    if (!session.storageType) {
      return res.status(400).json({ success: false, error: '请先选择网盘并打开登录页' });
    }

    const loginState = await verifyLoginState(sessionId, session.storageType);

    updateSession(sessionId, {
      isLoggedIn: loginState.loggedIn,
      loginState,
      status: loginState.loggedIn ? 'ready_for_transfer' : 'waiting_login',
      phase: 'login',
      message: loginState.loggedIn ? '已通过真实登录校验，开始输入分享链接吧' : '尚未通过真实登录校验，请继续在浏览器里完成登录'
    });
    appendLog(session, loginState.loggedIn ? `手动检测到登录成功，cookie=${loginState.cookieCount}` : `手动检测仍未登录，cookie=${loginState.cookieCount}`);

    res.json({ success: true, loggedIn: loginState.loggedIn, session: ensureSession(sessionId) });
  } catch (error) {
    console.error('Check login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/transfer', async (req, res) => {
  try {
    const { shareUrl, storageType, sessionId } = req.body;
    const config = STORAGE_CONFIG[storageType];
    if (!config) return res.status(400).json({ success: false, error: '不支持的网盘类型' });
    if (!shareUrl || !validateShareUrl(shareUrl, storageType)) {
      return res.status(400).json({ success: false, error: '分享链接格式不正确，和所选网盘不匹配' });
    }

    const session = ensureSession(sessionId);
    if (!session.isLoggedIn) {
      return res.status(400).json({ success: false, error: '尚未检测到登录，请先完成登录' });
    }

    updateSession(sessionId, {
      status: 'transferring',
      phase: 'transfer',
      shareUrl,
      message: '正在打开分享链接并尝试转存...'
    });
    appendLog(session, `开始转存链接: ${shareUrl}`);

    const page = await getOrCreatePage(sessionId, 'transferPage');
    await page.goto(shareUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const detectedFileName = await extractSharedFileName(page);
    if (detectedFileName) {
      updateSession(sessionId, { targetFileName: detectedFileName });
      appendLog(session, `识别到转存目标文件: ${detectedFileName}`);
    } else {
      appendLog(session, '未稳定识别到目标文件名，后续优先依赖成功页入口');
    }

    let selectedItem = { selected: false };
    let clicked = null;

    if (storageType === 'quark') {
      const result = await triggerQuarkTransfer(page, session, detectedFileName || '');
      selectedItem = result.selectedItem;
      clicked = result.clicked;
      appendLog(session, `夸克转存触发结果: method=${result.method}, clicked=${result.clicked || 'none'}`);
    } else {
      selectedItem = await selectSharedFileItem(page, detectedFileName || '', session);
      clicked = await safeClick(page, config.saveButtons, 4000);
      if (!clicked && config.moreButtons?.length) {
        const moreClicked = await safeClick(page, config.moreButtons, 2000);
        if (moreClicked) {
          appendLog(session, `已点击更多操作: ${moreClicked}`);
          await page.waitForTimeout(1200);
          clicked = await safeClick(page, config.saveButtons, 3000);
        }
      }
    }

    if (!clicked) {
      const visibleTexts = await collectVisibleTexts(page, 60);
      appendLog(session, `未找到自动转存按钮，可见文本片段: ${visibleTexts.join(' | ').slice(0, 500)}`);
      if (!selectedItem.selected) appendLog(session, '推测原因: 未选中分享页中的文件项');
      updateSession(sessionId, {
        status: 'needs_manual_transfer',
        phase: 'transfer',
        message: '没自动找到“保存到网盘”按钮，请在浏览器中手动点一下，完成后再点“我已完成转存”'
      });
      appendLog(session, '未找到自动转存按钮，切换为人工补一步');
      return res.json({ success: true, manual: true, session: ensureSession(sessionId) });
    }

    appendLog(session, `已点击按钮: ${clicked}`);
    await page.waitForTimeout(1500);

    let confirmed = await safeClick(page, config.confirmButtons, 3000);
    if (!confirmed && storageType === 'quark') {
      confirmed = await safeClickByText(page, ['确定', '确认', '保存', '继续保存'], session, { exact: false });
    }
    if (confirmed) appendLog(session, `已点击确认按钮: ${confirmed}`);

    await page.waitForTimeout(2500);
    const transferContext = await parseTransferSuccessContext(page, session);

    let transferVerified = Boolean(transferContext.verified);
    let driveCheck = { found: false, reason: 'skipped' };

    if (!transferVerified && detectedFileName) {
      appendLog(session, '页面成功信号不足，开始进入网盘做二次校验');
      const verifyPage = await getOrCreatePage(sessionId, 'sharePage');
      await verifyPage.goto(config.homeUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
      await verifyPage.waitForTimeout(2200);
      driveCheck = await locateFileInDrive(verifyPage, detectedFileName, session, { verifyOnly: true });
      transferVerified = driveCheck.found;
      appendLog(session, transferVerified ? '已在我的网盘中验证到目标文件' : '未能在我的网盘中验证到目标文件');
    }

    updateSession(sessionId, {
      transferCompleted: transferVerified,
      transferVerified,
      transferContext,
      driveCheck,
      status: transferVerified ? 'transfer_done' : 'transfer_unverified',
      phase: 'transfer',
      message: transferVerified
        ? '转存已验证成功，可以继续分享'
        : '已执行转存点击，但未验证文件真的进入网盘，请先人工确认，不自动进入分享阶段'
    });
    appendLog(session, transferVerified ? '自动转存完成，并通过校验' : '转存结果未通过校验，已阻止进入自动分享');

    res.json({ success: true, manual: !transferVerified, verified: transferVerified, session: ensureSession(sessionId) });
  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/confirm-transfer', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = updateSession(sessionId, {
      transferCompleted: true,
      status: 'transfer_done',
      phase: 'transfer',
      message: '已标记转存完成，现在开始生成分享链接'
    });
    appendLog(session, '用户确认转存已完成');
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/share', async (req, res) => {
  try {
    const { sessionId, storageType } = req.body;
    const session = ensureSession(sessionId);
    const actualStorage = storageType || session.storageType;
    const config = STORAGE_CONFIG[actualStorage];
    if (!config) return res.status(400).json({ success: false, error: '不支持的网盘类型' });
    if (!session.transferCompleted) {
      return res.status(400).json({ success: false, error: '请先完成转存' });
    }

    updateSession(sessionId, {
      status: 'sharing',
      phase: 'share',
      message: '正在打开网盘并尝试生成分享链接...'
    });
    appendLog(session, '开始执行分享流程');

    const page = await getOrCreatePage(sessionId, 'sharePage');
    let openedFromSuccessPage = { opened: false };

    if (session.transferPage && !session.transferPage.isClosed()) {
      appendLog(session, '优先尝试从转存成功页直接进入目标文件');
      openedFromSuccessPage = await openTransferredTarget(session.transferPage, session);
    }

    if (!openedFromSuccessPage.opened) {
      appendLog(session, '准备进入我的网盘首页');
      await page.goto(config.homeUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(2500);
      appendLog(session, '已进入我的网盘首页');
    } else {
      appendLog(session, '已从转存成功页进入后续页面');
    }

    let located = { found: false, reason: 'missing_target_file' };
    if (!openedFromSuccessPage.opened) {
      if (session.targetFileName) {
        located = await locateFileInDrive(page, session.targetFileName, session);
        appendLog(session, located.found
          ? `已定位到目标文件: ${session.targetFileName}`
          : `未定位到目标文件: ${session.targetFileName}`);
      } else {
        appendLog(session, '未拿到目标文件名，无法精确定位');
      }
    } else {
      located = { found: true, reason: 'opened_from_success_page' };
    }

    appendLog(session, '开始尝试执行分享动作');
    const activePage = openedFromSuccessPage.opened ? session.transferPage : page;
    session.sharePage = activePage;
    const shareAttempt = await tryShareFlow(activePage, config, actualStorage, session);
    if (shareAttempt.shareClicked) appendLog(session, `已点击分享按钮: ${shareAttempt.shareClicked}`);
    if (shareAttempt.copyClicked) appendLog(session, `已点击复制链接按钮: ${shareAttempt.copyClicked}`);

    if (shareAttempt.ok) {
      updateSession(sessionId, {
        shareResult: shareAttempt.shareResult,
        status: 'done',
        phase: 'done',
        message: '分享链接已生成'
      });
      appendLog(session, `已提取分享链接: ${shareAttempt.shareResult}`);
      return res.json({ success: true, manual: false, shareUrl: shareAttempt.shareResult, session: ensureSession(sessionId) });
    }

    updateSession(sessionId, {
      status: 'needs_manual_share',
      phase: 'share',
      message: shareAttempt.stage === 'share_button'
        ? (located.found
            ? '已定位到转存文件，但没自动找到“分享”按钮，请在浏览器中确认已选中文件后点分享，再回来点“提取分享链接”'
            : '没精确定位到刚转存的文件，请在浏览器中手动找到该文件并点分享，完成后点“提取分享链接”')
        : '自动提取分享链接失败，请在浏览器中复制分享链接后点“提取分享链接”'
    });
    appendLog(session, shareAttempt.stage === 'share_button'
      ? (located.found ? '已定位文件，但分享按钮未出现，等待人工补一步' : '未定位到目标文件，等待人工补一步')
      : '自动提取分享链接失败，等待人工补一步');

    res.json({ success: true, manual: true, session: ensureSession(sessionId) });
  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/fetch-share-link', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = ensureSession(sessionId);
    const page = session.sharePage && !session.sharePage.isClosed()
      ? session.sharePage
      : session.transferPage && !session.transferPage.isClosed()
        ? session.transferPage
        : session.mainPage && !session.mainPage.isClosed()
          ? session.mainPage
          : await getOrCreatePage(sessionId);

    const shareResult = await extractShareLink(page, session.storageType);
    if (!shareResult) {
      appendLog(session, '未提取到分享链接');
      return res.status(400).json({ success: false, error: '当前页面没抓到分享链接，请先在浏览器里完成分享' });
    }

    updateSession(sessionId, {
      shareResult,
      status: 'done',
      phase: 'done',
      message: '已提取到分享链接'
    });
    appendLog(session, `手动补提取成功: ${shareResult}`);

    res.json({ success: true, shareUrl: shareResult, session: ensureSession(sessionId) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auto-verify-login', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = ensureSession(sessionId);
    if (!session.storageType) {
      return res.status(400).json({ success: false, error: '当前 session 还没有选定网盘' });
    }

    const loginState = await verifyLoginState(sessionId, session.storageType);
    updateSession(sessionId, {
      isLoggedIn: loginState.loggedIn,
      loginState,
      status: loginState.loggedIn ? 'ready_for_transfer' : 'waiting_login',
      phase: 'login',
      message: loginState.loggedIn ? '自动真实登录校验通过' : '自动真实登录校验未通过'
    });
    appendLog(session, loginState.loggedIn
      ? `手动触发自动登录校验成功，cookie=${loginState.cookieCount}`
      : `手动触发自动登录校验失败，cookie=${loginState.cookieCount}`);
    res.json({ success: true, loginState, session: ensureSession(sessionId) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/debug/login', async (req, res) => {
  try {
    const { sessionId } = req.query;
    const session = ensureSession(sessionId);
    if (!session.storageType) {
      return res.status(400).json({ success: false, error: '当前 session 还没有选定网盘' });
    }

    const loginState = await verifyLoginState(sessionId, session.storageType);
    updateSession(sessionId, { isLoggedIn: loginState.loggedIn, loginState });
    res.json({ success: true, loginState });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/debug/page', async (req, res) => {
  try {
    const { sessionId, pageKey = 'mainPage' } = req.query;
    const session = ensureSession(sessionId);
    const page = session[pageKey];
    if (!page || page.isClosed()) {
      return res.status(400).json({ success: false, error: `页面不存在: ${pageKey}` });
    }

    const url = page.url();
    const title = await page.title().catch(() => '');
    const visibleTexts = await collectVisibleTexts(page, 120);
    const htmlSnippet = await page.locator('body').evaluate((el) => el.innerText.slice(0, 4000)).catch(() => '');
    const buttons = await page.locator('button, a, [role="button"]').evaluateAll((nodes) =>
      nodes.slice(0, 80).map((node) => ({
        text: (node.textContent || '').trim(),
        cls: node.className || '',
        role: node.getAttribute('role') || '',
        title: node.getAttribute('title') || ''
      }))
    ).catch(() => []);
    const candidates = await page.locator('[title], [aria-label], [class]').evaluateAll((nodes) =>
      nodes.slice(0, 200).map((node) => ({
        text: (node.textContent || '').trim().slice(0, 120),
        title: node.getAttribute('title') || '',
        ariaLabel: node.getAttribute('aria-label') || '',
        cls: node.className || ''
      })).filter((item) => item.text || item.title || item.ariaLabel)
    ).catch(() => []);

    res.json({
      success: true,
      pageKey,
      url,
      title,
      visibleTexts,
      htmlSnippet,
      buttons,
      candidates
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/reset', async (req, res) => {
  try {
    const { sessionId } = req.body;
    sessions.delete(sessionId);
    const bundle = browserContexts.get(sessionId);
    if (bundle) {
      await bundle.context.close().catch(() => {});
      await bundle.browser.close().catch(() => {});
      browserContexts.delete(sessionId);
    }
    persistSessions();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});

loadPersistedSessions();

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 PanTools - 网盘转存工具                              ║
║                                                           ║
║   服务已启动: http://localhost:${PORT}                    ║
║                                                           ║
║   当前状态: 半自动闭环版                                  ║
║   登录检测 / 转存状态 / 分享提取 已接通                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
});