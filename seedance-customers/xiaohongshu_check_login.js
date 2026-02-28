
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

async function main() {
  console.log('========================================');
  console.log('小红书 - 检查登录状态');
  console.log('========================================\n');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  // 加载之前保存的状态
  const statePath = path.join(WORK_DIR, 'xiaohongshu_original_state.json');
  const context = await browser.newContext({
    storageState: statePath,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 2000 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  const page = await context.newPage();

  try {
    // 访问小红书首页
    console.log('正在访问小红书首页，检查登录状态...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // 截图首页
    const checkScreenshot = path.join(WORK_DIR, 'xiaohongshu_check_login.png');
    await page.screenshot({ path: checkScreenshot, fullPage: true });
    console.log(`检查登录状态截图已保存: ${checkScreenshot}`);

    console.log('\n========================================');
    console.log('检查完成！请查看截图确认是否登录成功！');
    console.log('========================================');

    // 保存cookies
    const cookies = await context.cookies();
    fs.writeFileSync(path.join(WORK_DIR, 'xiaohongshu_check_cookies.json'), JSON.stringify(cookies, null, 2));
    console.log('Cookies已保存');

  } catch (error) {
    console.error('执行过程出错:', error);
  } finally {
    await browser.close();
  }
}

main();

