
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

// 搜索关键词
const KEYWORDS = ['AI视频生成', '视频制作', '电商视频'];

async function main() {
  console.log('========================================');
  console.log('小红书 - 完整流程（同一浏览器）');
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

    // 截图二维码页面
    const qrcodeScreenshot = path.join(WORK_DIR, 'xiaohongshu_full_qrcode.png');
    await page.screenshot({ path: qrcodeScreenshot, fullPage: true });
    console.log(`二维码页面截图已保存: ${qrcodeScreenshot}`);

    console.log('\n========================================');
    console.log('二维码已生成！');
    console.log('文件: xiaohongshu_full_qrcode.png');
    console.log('========================================\n');

    // 保存当前状态和cookies
    const state = {
      message: '二维码已生成，等待用户扫码',
      qrcodeFile: qrcodeScreenshot,
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync(path.join(WORK_DIR, 'xiaohongshu_waiting.json'), JSON.stringify(state, null, 2));

    // 保存cookies
    const cookies = await context.cookies();
    fs.writeFileSync(path.join(WORK_DIR, 'xiaohongshu_full_cookies.json'), JSON.stringify(cookies, null, 2));
    console.log('Cookies已保存');

    // 保存浏览器状态，用于后续继续
    await context.storageState({ path: path.join(WORK_DIR, 'xiaohongshu_full_state.json') });
    console.log('浏览器状态已保存');

    console.log('\n========================================');
    console.log('请用户扫码后，告诉我！');
    console.log('然后我会在同一个浏览器会话中继续调研！');
    console.log('========================================');

    // 不关闭浏览器，保持会话
    // 但是我们先保存状态，然后关闭，等用户扫码后再恢复

  } catch (error) {
    console.error('执行过程出错:', error);
  } finally {
    await browser.close();
  }
}

main();

