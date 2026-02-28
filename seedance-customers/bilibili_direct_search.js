
const { chromium } = require('playwright');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

async function main() {
  console.log('========================================');
  console.log('直接访问B站搜索页面');
  console.log('========================================\n');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  const page = await context.newPage();

  try {
    const searchUrl = 'https://search.bilibili.com/all?keyword=数字人歌手';
    console.log(`正在访问: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(5000);

    console.log('✅ 页面加载完成');

    // 截图
    const screenshotPath = path.join(WORK_DIR, 'bilibili_digital_singer_direct.png');
    console.log('正在截图...');
    await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 60000 });

    console.log(`✅ 截图已保存: ${screenshotPath}`);

  } catch (error) {
    console.error('访问出错:', error);
  } finally {
    await browser.close();
  }
}

main();

