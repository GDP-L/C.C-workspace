
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';
const QRCODE_PATH = path.join(WORK_DIR, 'xiaohongshu_kali_qrcode.png');
const COOKIES_PATH = path.join(WORK_DIR, 'xiaohongshu_kali_cookies.json');
const READY_FLAG = path.join(WORK_DIR, 'xiaohongshu_qrcode_ready.flag');
const LOGGEDIN_FLAG = path.join(WORK_DIR, 'xiaohongshu_loggedin.flag');

// 搜索关键词
const KEYWORDS = ['AI视频生成', '视频制作', '电商视频'];

async function main() {
  console.log('========================================');
  console.log('小红书扫码登录 - 重新获取二维码');
  console.log('========================================\n');

  // 清理旧的标志文件
  if (fs.existsSync(READY_FLAG)) fs.unlinkSync(READY_FLAG);
  if (fs.existsSync(LOGGEDIN_FLAG)) fs.unlinkSync(LOGGEDIN_FLAG);

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

    // 查找并点击登录按钮
    console.log('正在查找登录按钮...');
    let loginClicked = false;
    
    const loginSelectors = [
      'button:has-text("登录")',
      'a:has-text("登录")',
      '[class*="login"]',
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

    if (!loginClicked) {
      console.log('没有找到明确的登录按钮，尝试点击页面右上角...');
      await page.click('body', { position: { x: 1700, y: 50 } });
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

    // 创建就绪标志文件
    fs.writeFileSync(READY_FLAG, JSON.stringify({
      status: 'ready',
      timestamp: new Date().toISOString(),
      qrcodePath: QRCODE_PATH
    }, null, 2), 'utf-8');

    console.log('\n========================================');
    console.log('✅ 二维码已准备好！');
    console.log('✅ 请用手机小红书APP扫码登录！');
    console.log('========================================\n');

    // 等待用户扫码 - 持续检查登录状态
    console.log('正在等待用户扫码... (每5秒检查一次)');
    
    let loggedIn = false;
    let checkCount = 0;
    const maxChecks = 120; // 最多等待10分钟

    while (!loggedIn && checkCount < maxChecks) {
      checkCount++;
      await page.waitForTimeout(5000);

      // 检查是否已经登录
      try {
        // 检查URL是否变化
        const currentUrl = page.url();
        console.log(`[${checkCount}/${maxChecks}] 当前URL: ${currentUrl}`);

        // 检查是否有登录后的元素
        const loggedInIndicators = [
          'text=首页',
          'text=发现',
          'text=消息',
          'text=我',
          '[class*="avatar"]',
          '[class*="user"]'
        ];

        for (const indicator of loggedInIndicators) {
          try {
            const element = await page.$(indicator);
            if (element) {
              console.log(`检测到登录成功指示器: ${indicator}`);
              loggedIn = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        // 截图当前状态
        const statusScreenshot = path.join(WORK_DIR, `xiaohongshu_kali_status_${checkCount}.png`);
        await page.screenshot({ path: statusScreenshot, fullPage: false });

      } catch (error) {
        console.log(`检查状态时出错: ${error.message}`);
      }
    }

    if (loggedIn) {
      console.log('\n✅ 用户扫码成功！');
      
      // 保存cookies
      const cookies = await context.cookies();
      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2), 'utf-8');
      console.log(`Cookies已保存: ${COOKIES_PATH}`);

      // 创建登录成功标志
      fs.writeFileSync(LOGGEDIN_FLAG, JSON.stringify({
        status: 'loggedin',
        timestamp: new Date().toISOString(),
        cookiesPath: COOKIES_PATH
      }, null, 2), 'utf-8');

      // 截图登录后的页面
      const loggedInScreenshot = path.join(WORK_DIR, 'xiaohongshu_kali_loggedin.png');
      await page.screenshot({ path: loggedInScreenshot, fullPage: false });
      console.log(`登录后截图已保存: ${loggedInScreenshot}`);

      // 开始搜索调研
      console.log('\n开始进行搜索调研...');
      const results = {
        loginSuccess: true,
        searchResults: [],
        timestamp: new Date().toISOString()
      };

      for (const keyword of KEYWORDS) {
        console.log(`\n搜索关键词: ${keyword}`);
        
        try {
          const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
          await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 60000 });
          await page.waitForTimeout(5000);
          
          const screenshotPath = path.join(WORK_DIR, `xiaohongshu_kali_${keyword}.png`);
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
      const resultsPath = path.join(WORK_DIR, 'xiaohongshu_kali_results.json');
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`结果已保存: ${resultsPath}`);

      console.log('\n========================================');
      console.log('✅ 小红书调研完成！');
      console.log('========================================');

    } else {
      console.log('\n❌ 等待超时，用户未在规定时间内扫码');
    }

  } catch (error) {
    console.error('执行过程出错:', error);
    // 截图错误状态
    const errorScreenshot = path.join(WORK_DIR, 'xiaohongshu_kali_error.png');
    await page.screenshot({ path: errorScreenshot, fullPage: false });
    console.log(`错误截图已保存: ${errorScreenshot}`);
  } finally {
    // 保持浏览器打开一段时间，方便调试
    console.log('\n任务完成，浏览器将在30秒后关闭...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

main().catch(console.error);
