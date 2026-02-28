
const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 3000 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  const page = await context.newPage();

  try {
    console.log('正在访问小红书首页...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log('截图首页...');
    await page.screenshot({ path: path.join(__dirname, 'test_xiaohongshu_home.png'), fullPage: true });

    console.log('找登录按钮...');
    const loginSelectors = [
      'button:has-text("登录")',
      'a:has-text("登录")',
      'text=登录'
    ];

    let loginClicked = false;
    for (const selector of loginSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`找到登录按钮: ${selector}`);
          await element.click();
          loginClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!loginClicked) {
      console.log('未找到登录按钮');
    } else {
      await page.waitForTimeout(3000);
      console.log('截图登录弹窗...');
      await page.screenshot({ path: path.join(__dirname, 'test_xiaohongshu_login_popup.png'), fullPage: true });
      
      console.log('打印页面HTML...');
      const html = await page.content();
      console.log(html.substring(0, 5000));
    }

  } catch (error) {
    console.error('出错:', error);
  } finally {
    await browser.close();
  }
}

main();

