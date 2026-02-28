
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

// Cookie文件路径
const COOKIES_PATH = path.join(WORK_DIR, 'xiaohongshu_cookies.json');

// 站大爷隧道代理配置
const PROXY_CONFIG = {
  server: 'http://a963.zdtps.com:21166',
  username: '202602271335241351',
  password: 'rbsqmwrq'
};

async function main() {
  console.log('========================================');
  console.log('测试：代理+Cookie访问小红书（快速截图）');
  console.log('========================================\n');

  // 加载Cookie
  console.log('正在加载Cookie...');
  const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
  console.log(`✅ 加载了 ${cookies.length} 个Cookie\n`);

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    proxy: {
      server: PROXY_CONFIG.server,
      username: PROXY_CONFIG.username,
      password: PROXY_CONFIG.password
    }
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  // 添加Cookie到context
  console.log('正在添加Cookie到浏览器...');
  for (const cookie of cookies) {
    const playwrightCookie = {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite === 'unspecified' ? 'Lax' : cookie.sameSite
    };
    if (cookie.expirationDate) {
      playwrightCookie.expires = cookie.expirationDate;
    }
    await context.addCookies([playwrightCookie]);
  }
  console.log('✅ Cookie添加完成\n');

  const page = await context.newPage();

  try {
    console.log('正在访问小红书...');
    // 不等待load，先访问，只等15秒就截图
    const navigationPromise = page.goto('https://www.xiaohongshu.com/', { 
      waitUntil: 'commit', // 最快的等待条件
      timeout: 30000 
    });

    // 不管有没有加载完，15秒后截图
    await page.waitForTimeout(15000);

    console.log('正在截图...');
    const screenshotPath = path.join(WORK_DIR, 'xiaohongshu_proxy_test_now.png');
    await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 30000 });
    console.log('✅ 截图已保存:', screenshotPath);

    // 打印页面URL和标题（如果有的话）
    try {
      const url = page.url();
      const title = await page.title();
      console.log('页面URL:', url);
      console.log('页面标题:', title);
    } catch (e) {
      console.log('获取页面信息失败:', e.message);
    }

    await browser.close();
    return { success: true, screenshotPath };
    
  } catch (error) {
    console.log('\n访问出错，但尝试截图:', error.message);
    // 即使出错也尝试截图
    try {
      const screenshotPath = path.join(WORK_DIR, 'xiaohongshu_proxy_test_error.png');
      await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 30000 });
      console.log('✅ 错误截图已保存:', screenshotPath);
      await browser.close();
      return { success: false, screenshotPath, error: error.message };
    } catch (screenshotError) {
      console.log('截图也失败:', screenshotError.message);
      await browser.close();
      return { success: false, error: error.message };
    }
  }
}

main();

