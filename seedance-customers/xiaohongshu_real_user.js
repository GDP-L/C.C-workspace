
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

async function main() {
  console.log('========================================');
  console.log('小红书 - 真实用户配置');
  console.log('========================================\n');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,  // 服务器没有图形界面，还是用无头模式
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',  // 禁用自动化控制特征
      '--disable-infobars',
      '--window-size=1920,1080'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    permissions: ['geolocation'],
    geolocation: { latitude: 31.2304, longitude: 121.4737 },  // 上海
    extraHTTPHeaders: {
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
    }
  });

  // 移除webdriver属性，防止被检测
  await context.addInitScript(() =&gt; {
    Object.defineProperty(navigator, 'webdriver', {
      get: () =&gt; undefined,
    });
  });

  const page = await context.newPage();

  try {
    // 直接访问小红书官网
    console.log('正在直接访问小红书官网...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);

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

    await page.waitForTimeout(2500);

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

    await page.waitForTimeout(3500);

    // 直接截图二维码页面
    const qrcodeScreenshot = path.join(WORK_DIR, 'xiaohongshu_real_user_qrcode.png');
    await page.screenshot({ path: qrcodeScreenshot, fullPage: true });
    console.log(`真实用户配置二维码截图已保存: ${qrcodeScreenshot}`);

    console.log('\n========================================');
    console.log('真实用户配置二维码已截图！');
    console.log('文件: xiaohongshu_real_user_qrcode.png');
    console.log('========================================');

    // 保存当前状态
    const state = {
      message: '真实用户配置二维码已生成，等待用户扫码',
      qrcodeFile: qrcodeScreenshot,
      timestamp: new Date().toISOString(),
      note: '使用了真实用户配置，禁用了自动化检测特征'
    };

    fs.writeFileSync(path.join(WORK_DIR, 'xiaohongshu_real_user_waiting.json'), JSON.stringify(state, null, 2));
    console.log('等待状态已保存');

  } catch (error) {
    console.error('执行过程出错:', error);
  } finally {
    await browser.close();
  }
}

main();

