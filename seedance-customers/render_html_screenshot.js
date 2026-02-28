
const { chromium } = require('playwright');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'xiaohongshu_curl_result.html');
const SCREENSHOT_PATH = path.join(__dirname, 'xiaohongshu_curl_rendered.png');

async function main() {
  console.log('正在渲染HTML文件...');
  console.log('HTML文件:', HTML_PATH);

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 3000 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  const page = await context.newPage();

  try {
    // 打开本地HTML文件
    const fileUrl = 'file://' + HTML_PATH.replace(/\\/g, '/');
    await page.goto(fileUrl, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 截图
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false, timeout: 60000 });
    console.log('✅ 截图已保存:', SCREENSHOT_PATH);

    await browser.close();
    return { success: true, screenshotPath: SCREENSHOT_PATH };
    
  } catch (error) {
    console.log('❌ 渲染失败:', error.message);
    await browser.close();
    return { success: false, error: error.message };
  }
}

main();

