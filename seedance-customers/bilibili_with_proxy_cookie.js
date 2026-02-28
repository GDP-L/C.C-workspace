
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';
const BILIBILI_COOKIES_PATH = path.join(WORK_DIR, 'bilibili_cookies.json');

// 站大爷代理配置
const ZHIDAYE_PROXY = {
  server: 'http://a963.zdtps.com:21166',
  username: '202602271335241351',
  password: 'rbsqmwrq'
};

async function main() {
  console.log('========================================');
  console.log('B站 - 站大爷代理+Cookie 访问测试');
  console.log('========================================\n');

  // 加载Cookie
  console.log('正在加载B站Cookie...');
  const cookies = JSON.parse(fs.readFileSync(BILIBILI_COOKIES_PATH, 'utf-8'));
  console.log(`✅ 加载了 ${cookies.length} 个Cookie\n`);

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ],
    proxy: ZHIDAYE_PROXY
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  // 添加反检测脚本
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
  });

  // 添加Cookie到context
  console.log('正在添加Cookie到浏览器...');
  for (const cookie of cookies) {
    let sameSite = 'Lax';
    if (cookie.sameSite === 'no_restriction') sameSite = 'None';
    if (cookie.sameSite === 'Strict') sameSite = 'Strict';
    if (cookie.sameSite === 'Lax') sameSite = 'Lax';

    const playwrightCookie = {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: sameSite
    };
    if (cookie.expirationDate) {
      playwrightCookie.expires = cookie.expirationDate;
    }
    await context.addCookies([playwrightCookie]);
  }
  console.log('✅ Cookie添加完成\n');

  const page = await context.newPage();

  try {
    const searchUrl = 'https://search.bilibili.com/all?keyword=数字人歌手';
    console.log(`正在访问: ${searchUrl}`);
    
    // 只用domcontentloaded，不等待太多
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✅ domcontentloaded完成');

    // 再等一会儿，让JavaScript加载内容
    await page.waitForTimeout(15000);
    console.log('✅ 等待JavaScript加载完成');

    // 截图
    const screenshotPath = path.join(WORK_DIR, 'bilibili_with_proxy_cookie.png');
    console.log('正在截图...');
    await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 60000 });
    console.log(`✅ 截图已保存: ${screenshotPath}`);

    // 同时保存HTML
    const htmlPath = path.join(WORK_DIR, 'bilibili_with_proxy_cookie.html');
    const htmlContent = await page.content();
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`✅ HTML已保存: ${htmlPath} (${(htmlContent.length / 1024).toFixed(2)} KB)`);

  } catch (error) {
    console.error('访问出错:', error);
  } finally {
    await browser.close();
  }
}

main();

