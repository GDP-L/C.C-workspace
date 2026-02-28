
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';
const COOKIES_PATH = path.join(WORK_DIR, 'xiaohongshu_simple_cookies.json');

// 搜索关键词
const KEYWORDS = ['AI视频生成', '视频制作', '电商视频'];

async function main() {
  console.log('========================================');
  console.log('小红书调研 - 简化版');
  console.log('========================================\n');

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1920, height: 2000 },
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai'
  });

  const page = await context.newPage();
  const results = {
    loginSuccess: false,
    searchResults: [],
    timestamp: new Date().toISOString()
  };

  try {
    // 访问小红书首页
    console.log('正在访问小红书首页...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // 截图首页
    const homeScreenshot = path.join(WORK_DIR, 'xiaohongshu_simple_home.png');
    await page.screenshot({ path: homeScreenshot, fullPage: true });
    console.log(`首页截图已保存: ${homeScreenshot}`);

    // 尝试找登录按钮
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
    const loginScreenshot = path.join(WORK_DIR, 'xiaohongshu_simple_login.png');
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
    const qrcodeScreenshot = path.join(WORK_DIR, 'xiaohongshu_simple_qrcode.png');
    await page.screenshot({ path: qrcodeScreenshot, fullPage: true });
    console.log(`二维码页面截图已保存: ${qrcodeScreenshot}`);

    console.log('\n请用手机小红书APP扫码登录！');
    console.log('扫码后等待10秒，我会继续...\n');

    // 等待用户扫码
    await page.waitForTimeout(15000);

    // 保存cookies
    const cookies = await context.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2), 'utf-8');
    console.log('Cookies已保存');

    // 截图登录后的页面
    const loggedInScreenshot = path.join(WORK_DIR, 'xiaohongshu_simple_loggedin.png');
    await page.screenshot({ path: loggedInScreenshot, fullPage: true });
    console.log(`登录后截图已保存: ${loggedInScreenshot}`);

    results.loginSuccess = true;

    // 开始搜索
    console.log('\n开始搜索...');
    for (const keyword of KEYWORDS) {
      console.log(`搜索关键词: ${keyword}`);
      
      try {
        const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(5000);
        
        const screenshotPath = path.join(WORK_DIR, `xiaohongshu_simple_${keyword}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`截图已保存: ${screenshotPath}`);
        
        results.searchResults.push({
          keyword: keyword,
          url: searchUrl,
          screenshot: screenshotPath
        });
        
      } catch (error) {
        console.error(`搜索出错: ${error.message}`);
        results.searchResults.push({ keyword: keyword, error: error.message });
      }
    }

    // 保存结果
    const resultsPath = path.join(WORK_DIR, 'xiaohongshu_simple_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`结果已保存: ${resultsPath}`);

    console.log('\n========================================');
    console.log('小红书调研完成！');
    console.log('========================================');

  } catch (error) {
    console.error('执行过程出错:', error);
  } finally {
    await browser.close();
  }
}

main();

