
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';
const QRCODE_PATH = path.join(WORK_DIR, 'xiaohongshu_kali_qrcode.png');
const STATE_PATH = path.join(WORK_DIR, 'xiaohongshu_kali_state.json');

async function main() {
  console.log('========================================');
  console.log('获取小红书登录二维码');
  console.log('========================================\n');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  const page = await context.newPage();

  try {
    // 访问小红书首页
    console.log('正在访问小红书首页...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    // 截图首页
    const homeScreenshot = path.join(WORK_DIR, 'xiaohongshu_kali_home.png');
    await page.screenshot({ path: homeScreenshot, fullPage: false });
    console.log(`首页截图已保存: ${homeScreenshot}`);

    // 保存页面HTML用于调试
    const pageHtml = await page.content();
    fs.writeFileSync(path.join(WORK_DIR, 'xiaohongshu_kali_page.html'), pageHtml, 'utf-8');

    // 查找并点击登录按钮
    console.log('正在查找登录按钮...');
    let loginClicked = false;
    
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
          loginClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await page.waitForTimeout(5000);

    // 截图登录页面
    const loginPageScreenshot = path.join(WORK_DIR, 'xiaohongshu_kali_login_page.png');
    await page.screenshot({ path: loginPageScreenshot, fullPage: false });
    console.log(`登录页面截图已保存: ${loginPageScreenshot}`);

    // 查找并点击扫码登录选项
    console.log('正在查找扫码登录选项...');
    let qrcodeClicked = false;
    
    const qrcodeSelectors = [
      'text=扫码登录',
      'text=二维码登录',
      'text=扫码',
      'text=二维码'
    ];

    for (const selector of qrcodeSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`找到扫码登录选项: ${selector}`);
          await element.click();
          qrcodeClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await page.waitForTimeout(5000);

    // 截图二维码页面
    console.log('正在截取二维码...');
    await page.screenshot({ path: QRCODE_PATH, fullPage: false });
    console.log(`二维码截图已保存: ${QRCODE_PATH}`);

    // 保存状态和context
    const state = await context.storageState();
    fs.writeFileSync(STATE_PATH, JSON.stringify({
      status: 'qrcode_ready',
      timestamp: new Date().toISOString(),
      qrcodePath: QRCODE_PATH,
      storageState: state
    }, null, 2), 'utf-8');

    console.log('\n========================================');
    console.log('✅ 二维码已准备好！');
    console.log(`✅ 保存位置: ${QRCODE_PATH}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('执行过程出错:', error);
    // 截图错误状态
    const errorScreenshot = path.join(WORK_DIR, 'xiaohongshu_kali_error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: false });
    console.log(`错误截图已保存: ${errorScreenshot}`);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
