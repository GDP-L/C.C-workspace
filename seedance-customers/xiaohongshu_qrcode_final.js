
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

async function main() {
  console.log('========================================');
  console.log('小红书 - 重新生成二维码');
  console.log('========================================\n');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1920, height: 3000 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  const page = await context.newPage();

  try {
    // 访问小红书首页
    console.log('正在访问小红书首页...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // 截图首页
    const homeScreenshot = path.join(WORK_DIR, 'xiaohongshu_final_home.png');
    await page.screenshot({ path: homeScreenshot, fullPage: true });
    console.log(`首页截图已保存: ${homeScreenshot}`);

    // 找登录按钮
    console.log('正在找登录按钮...');
    const loginSelectors = [
      'button:has-text("登录")',
      'a:has-text("登录")',
      'text=登录'
    ];

    for (const selector of loginSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`找到登录按钮: ${selector}`);
          await element.click();
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await page.waitForTimeout(3000);

    // 截图登录页面
    const loginScreenshot = path.join(WORK_DIR, 'xiaohongshu_final_login.png');
    await page.screenshot({ path: loginScreenshot, fullPage: true });
    console.log(`登录页面截图已保存: ${loginScreenshot}`);

    // 找扫码登录
    console.log('正在找扫码登录...');
    const qrcodeSelectors = [
      'text=扫码登录',
      'text=二维码',
      'text=扫码'
    ];

    for (const selector of qrcodeSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`找到扫码登录: ${selector}`);
          await element.click();
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await page.waitForTimeout(5000);

    // 截图二维码页面
    const qrcodeScreenshot = path.join(WORK_DIR, 'xiaohongshu_final_qrcode.png');
    await page.screenshot({ path: qrcodeScreenshot, fullPage: true });
    console.log(`二维码页面截图已保存: ${qrcodeScreenshot}`);

    console.log('\n========================================');
    console.log('二维码已生成！');
    console.log('文件: xiaohongshu_final_qrcode.png');
    console.log('========================================');

  } catch (error) {
    console.error('执行过程出错:', error);
  } finally {
    await browser.close();
  }
}

main();

