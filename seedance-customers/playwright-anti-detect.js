/**
 * Playwright 反爬虫优化配置示例
 * 可直接在项目中使用
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

/**
 * 创建反检测浏览器
 */
async function createAntiDetectBrowser(options = {}) {
  const {
    headless = false,
    proxy = null,
    userDataDir = null,
    viewport = { width: 1920, height: 1080 },
    userAgent = getRandomUserAgent(),
    locale = 'zh-CN',
    timezoneId = 'Asia/Shanghai'
  } = options;

  const launchOptions = {
    headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-software-rasterizer',
      '--disable-gpu',
      `--window-size=${viewport.width},${viewport.height}`,
      `--user-agent=${userAgent}`
    ]
  };

  if (proxy) {
    launchOptions.proxy = proxy;
  }

  if (userDataDir) {
    launchOptions.userDataDir = userDataDir;
  }

  const browser = await chromium.launch(launchOptions);

  const context = await browser.newContext({
    viewport,
    userAgent,
    locale,
    timezoneId,
    permissions: ['geolocation'],
    geolocation: { latitude: 31.2304, longitude: 121.4737 },
    colorScheme: 'light',
    reducedMotion: 'no-force'
  });

  // 注入反检测脚本
  await context.addInitScript(() => {
    // 1. 隐藏 webdriver 属性
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });

    // 2. 伪装 plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });

    // 3. 伪装 languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['zh-CN', 'zh', 'en']
    });

    // 4. 伪装 permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );

    // 5. 伪装 chrome 对象
    if (!window.chrome) {
      window.chrome = {
        runtime: {}
      };
    }
  });

  return { browser, context };
}

/**
 * 人类行为模拟器
 */
class HumanBehaviorSimulator {
  constructor(page) {
    this.page = page;
  }

  /**
   * 随机延迟
   */
  async randomDelay(min = 1000, max = 5000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await this.page.waitForTimeout(delay);
  }

  /**
   * 模拟点击（带随机偏移）
   */
  async humanClick(selector) {
    const element = await this.page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);

    const box = await element.boundingBox();
    const targetX = box.x + box.width / 2 + (Math.random() - 0.5) * (box.width * 0.3);
    const targetY = box.y + box.height / 2 + (Math.random() - 0.5) * (box.height * 0.3);

    // 移动到目标
    await this.page.mouse.move(targetX, targetY);
    
    // 悬停一会儿
    await this.page.waitForTimeout(150 + Math.random() * 350);
    
    // 点击
    await this.page.mouse.down();
    await this.page.waitForTimeout(50 + Math.random() * 100);
    await this.page.mouse.up();
    
    // 随机延迟
    await this.randomDelay(500, 2000);
  }

  /**
   * 模拟滚动
   */
  async humanScroll(targetScrollY) {
    const currentScrollY = await this.page.evaluate(() => window.scrollY);
    const distance = targetScrollY - currentScrollY;
    const steps = Math.max(5, Math.min(20, Math.ceil(Math.abs(distance) / 300)));
    
    for (let i = 1; i <= steps; i++) {
      const scrollY = currentScrollY + distance * (i / steps);
      await this.page.evaluate((y) => window.scrollTo(0, y), scrollY);
      await this.page.waitForTimeout(100 + Math.random() * 200);
    }
  }

  /**
   * 模拟键盘输入
   */
  async humanType(selector, text) {
    await this.humanClick(selector);
    
    for (const char of text) {
      await this.page.keyboard.type(char, { delay: 50 + Math.random() * 100 });
      if (Math.random() < 0.03) { // 3% chance of typo
        await this.page.waitForTimeout(150 + Math.random() * 250);
        await this.page.keyboard.press('Backspace');
        await this.page.waitForTimeout(100 + Math.random() * 150);
        await this.page.keyboard.type(char, { delay: 50 + Math.random() * 100 });
      }
    }
    
    await this.randomDelay(300, 1000);
  }
}

/**
 * Cookie管理器
 */
class CookieManager {
  constructor(cookieDir = './cookies') {
    this.cookieDir = cookieDir;
  }

  async ensureDir() {
    try {
      await fs.access(this.cookieDir);
    } catch {
      await fs.mkdir(this.cookieDir, { recursive: true });
    }
  }

  async save(context, name) {
    await this.ensureDir();
    const cookies = await context.cookies();
    const cookiePath = path.join(this.cookieDir, `${name}.json`);
    await fs.writeFile(cookiePath, JSON.stringify(cookies, null, 2));
    console.log(`✓ Cookies saved: ${cookiePath}`);
  }

  async load(context, name) {
    const cookiePath = path.join(this.cookieDir, `${name}.json`);
    try {
      const data = await fs.readFile(cookiePath, 'utf8');
      const cookies = JSON.parse(data);
      await context.addCookies(cookies);
      console.log(`✓ Cookies loaded: ${cookiePath}`);
      return true;
    } catch {
      console.log(`⚠ No cookies found for: ${name}`);
      return false;
    }
  }
}

/**
 * 获取随机User-Agent
 */
function getRandomUserAgent() {
  const userAgents = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

/**
 * 站大爷代理配置（示例）
 */
const ZHIDAYE_PROXY = {
  server: 'http://tunnel.zdaye.com:1080',
  username: 'your_username',
  password: 'your_password'
};

// 导出所有模块
module.exports = {
  createAntiDetectBrowser,
  HumanBehaviorSimulator,
  CookieManager,
  getRandomUserAgent,
  ZHIDAYE_PROXY
};

/**
 * 使用示例
 * 
 * // 基础使用
 * const { createAntiDetectBrowser, HumanBehaviorSimulator, CookieManager } = require('./playwright-anti-detect');
 * 
 * (async () => {
 *   const { browser, context } = await createAntiDetectBrowser();
 *   const page = await context.newPage();
 *   const behavior = new HumanBehaviorSimulator(page);
 *   const cookieManager = new CookieManager();
 *   
 *   await page.goto('https://www.xiaohongshu.com');
 *   await behavior.randomDelay();
 *   
 *   await browser.close();
 * })();
 */
