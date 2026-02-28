
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

async function main() {
  console.log('========================================');
  console.log('小红书 - 官网二维码（最终版）');
  console.log('========================================\n');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 2000 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  const page = await context.newPage();

  try {
    // 直接访问小红书官网
    console.log('正在直接访问小红书官网...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

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

    await page.waitForTimeout(2000);

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

    await page.waitForTimeout(3000);

    // 直接截图二维码页面
    const qrcodeScreenshot = path.join(WORK_DIR, 'xiaohongshu_final_official_qrcode.png');
    await page.screenshot({ path: qrcodeScreenshot, fullPage: true });
    console.log(`官网二维码截图已保存: ${qrcodeScreenshot}`);

    console.log('\n========================================');
    console.log('官网二维码已截图！');
    console.log('文件: xiaohongshu_final_official_qrcode.png');
    console.log('========================================');

    // 保存当前状态（未登录状态，等用户扫码后再重新保存）
    const state = {
      message: '官网二维码已生成，等待用户扫码，扫码后请告知',
      qrcodeFile: qrcodeScreenshot,
      timestamp: new Date().toISOString(),
      note: '此状态是未登录状态，等用户扫码后需要重新保存状态'
    };

    fs.writeFileSync(path.join(WORK_DIR, 'xiaohongshu_final_waiting.json'), JSON.stringify(state, null, 2));
    console.log('等待状态已保存');

  } catch (error) {
    console.error('执行过程出错:', error);
  } finally {
    await browser.close();
  }
}

main();

