
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

async function main() {
  console.log('========================================');
  console.log('小红书二维码登录 - 找二维码 v3');
  console.log('========================================\n');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 3000 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  const page = await context.newPage();

  try {
    // 访问小红书首页 - 不等待networkidle
    console.log('正在访问小红书首页...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // 等待页面加载
    await page.waitForTimeout(8000);

    // 截图首页
    const homeScreenshot = path.join(WORK_DIR, 'xiaohongshu_v3_home.png');
    await page.screenshot({ path: homeScreenshot, fullPage: true });
    console.log(`首页截图已保存: ${homeScreenshot}`);

    // 找登录按钮
    console.log('正在找登录按钮...');
    
    const loginSelectors = [
      'button:has-text("登录")',
      'a:has-text("登录")',
      '.login-btn',
      '[class*="login"]',
      'text=登录'
    ];

    let loginButtonFound = false;
    for (const selector of loginSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`找到登录按钮: ${selector}`);
          await element.click();
          loginButtonFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!loginButtonFound) {
      console.log('没有找到明确的登录按钮，尝试点击页面右上角');
      await page.click('body', { position: { x: 1800, y: 50 } });
    }

    // 等待登录弹窗出现
    await page.waitForTimeout(5000);

    // 截图登录页面
    const loginScreenshot = path.join(WORK_DIR, 'xiaohongshu_v3_login.png');
    await page.screenshot({ path: loginScreenshot, fullPage: true });
    console.log(`登录页面截图已保存: ${loginScreenshot}`);

    // 找二维码相关的元素
    console.log('正在找二维码登录选项...');
    
    // 尝试找"扫码登录"或"二维码"文字
    const qrcodeSelectors = [
      'text=扫码登录',
      'text=二维码',
      'text=扫码',
      'button:has-text("扫码")',
      'button:has-text("二维码")',
      'a:has-text("扫码")',
      'a:has-text("二维码")'
    ];

    let qrcodeFound = false;
    for (const selector of qrcodeSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`找到二维码登录选项: ${selector}`);
          await element.click();
          qrcodeFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!qrcodeFound) {
      console.log('没有找到明确的二维码登录选项，尝试找切换按钮');
      // 尝试找切换登录方式的按钮
      const switchSelectors = [
        'text=密码登录',
        'text=手机号登录',
        'text=其他方式',
        'text=更多'
      ];
      
      for (const selector of switchSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            console.log(`找到切换按钮: ${selector}`);
            await element.click();
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    // 等待二维码加载
    console.log('等待二维码加载...');
    await page.waitForTimeout(10000);

    // 截图二维码页面
    const qrcodeScreenshot = path.join(WORK_DIR, 'xiaohongshu_v3_qrcode.png');
    await page.screenshot({ path: qrcodeScreenshot, fullPage: true });
    console.log(`二维码页面截图已保存: ${qrcodeScreenshot}`);

    // 保存页面HTML
    const htmlPath = path.join(WORK_DIR, 'xiaohongshu_v3_page.html');
    const htmlContent = await page.content();
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log(`页面HTML已保存: ${htmlPath}`);

    console.log('\n========================================');
    console.log('二维码查找完成！');
    console.log(`请查看截图: ${qrcodeScreenshot}`);
    console.log('========================================');

  } catch (error) {
    console.error('执行过程出错:', error);
    
    // 截图错误页面
    try {
      const errorScreenshot = path.join(WORK_DIR, 'xiaohongshu_v3_error.png');
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      console.log(`错误页面截图已保存: ${errorScreenshot}`);
    } catch (e) {
      console.log('无法截图错误页面');
    }
  } finally {
    await browser.close();
  }
}

main();

