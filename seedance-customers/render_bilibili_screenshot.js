
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

async function main() {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    // 读取HTML文件内容
    const htmlPath = path.join(WORK_DIR, 'bilibili_search_digital_singer.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // 设置页面HTML
    console.log('正在渲染HTML...');
    await page.setContent(htmlContent, { waitUntil: 'networkidle', timeout: 60000 });

    // 等待一下
    await page.waitForTimeout(3000);

    // 截图
    const screenshotPath = path.join(WORK_DIR, 'bilibili_digital_singer_search.png');
    console.log('正在截图...');
    await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 60000 });

    console.log(`✅ 截图已保存: ${screenshotPath}`);

  } catch (error) {
    console.error('渲染出错:', error);
  } finally {
    await browser.close();
  }
}

main();

