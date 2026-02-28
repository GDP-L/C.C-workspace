
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

// 搜索关键词
const KEYWORDS = ['AI视频生成', '视频制作', '电商视频'];

// Cookie文件路径
const COOKIES_PATH = path.join(WORK_DIR, 'xiaohongshu_cookies.json');

async function checkLoginSuccess(page) {
  try {
    // 检查是否有用户头像或用户名元素
    const avatarSelectors = [
      'img[alt*="头像"]',
      'img[class*="avatar"]',
      'img[class*="Avatar"]',
      'div[class*="avatar"]',
      'div[class*="Avatar"]',
      'span[class*="username"]',
      'span[class*="Username"]'
    ];
    
    for (const selector of avatarSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ 找到登录状态元素: ${selector}`);
          return true;
        }
      } catch (e) {
        // 继续尝试下一个
      }
    }
    
    // 检查页面是否包含"登录"相关文字（未登录）
    const hasLoginText = await page.evaluate(() => {
      const loginTexts = ['登录', '扫码登录', '登录/注册', '登录按钮'];
      for (const text of loginTexts) {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.includes(text) && el.offsetParent !== null
        );
        if (elements.length > 0) {
          return true;
        }
      }
      return false;
    });
    
    if (!hasLoginText) {
      console.log('✅ 页面无登录相关文字，判断为已登录');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('检查登录状态时出错:', error);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('小红书 - Cookie复用版');
  console.log('========================================\n');

  // 加载Cookie
  console.log('正在加载Cookie...');
  const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
  console.log(`✅ 加载了 ${cookies.length} 个Cookie\n`);

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

  // 添加Cookie到context
  console.log('正在添加Cookie到浏览器...');
  for (const cookie of cookies) {
    // 转换Cookie格式，适配Playwright
    const playwrightCookie = {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite === 'unspecified' ? 'Lax' : cookie.sameSite
    };
    if (cookie.expirationDate) {
      playwrightCookie.expires = cookie.expirationDate;
    }
    await context.addCookies([playwrightCookie]);
  }
  console.log('✅ Cookie添加完成\n');

  const page = await context.newPage();
  const results = {
    searchResults: [],
    timestamp: new Date().toISOString()
  };

  try {
    // 访问小红书首页
    console.log('正在访问小红书首页...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // 打印页面标题和URL
    console.log('页面标题:', await page.title());
    console.log('页面URL:', page.url());

    // 截图首页（只截视口，不截全屏）
    const homeScreenshot = path.join(WORK_DIR, 'xiaohongshu_cookie_home.png');
    await page.screenshot({ path: homeScreenshot, fullPage: false, timeout: 30000 });
    console.log(`首页截图已保存: ${homeScreenshot}`);

    // 打印页面HTML前5000字符，看看内容
    const html = await page.content();
    console.log('页面HTML前5000字符:');
    console.log(html.substring(0, 5000));

    // 验证登录状态
    console.log('\n正在验证登录状态...');
    const loginSuccess = await checkLoginSuccess(page);
    
    if (!loginSuccess) {
      console.log('❌ 登录验证失败！请检查Cookie是否有效？');
      return;
    }

    console.log('✅ 登录验证成功！');

    // 开始搜索
    console.log('\n开始搜索...');
    for (const keyword of KEYWORDS) {
      console.log(`\n搜索关键词: ${keyword}`);
      
      try {
        const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(8000);
        
        // 截图
        const screenshotPath = path.join(WORK_DIR, `xiaohongshu_cookie_${keyword}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`截图已保存: ${screenshotPath}`);
        
        results.searchResults.push({
          keyword: keyword,
          url: searchUrl,
          screenshot: screenshotPath
        });
        
        await page.waitForTimeout(3000);
        
      } catch (error) {
        console.error(`搜索出错: ${error.message}`);
        results.searchResults.push({
          keyword: keyword,
          error: error.message
        });
      }
    }

    // 保存结果
    const resultsPath = path.join(WORK_DIR, 'xiaohongshu_cookie_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n结果已保存到: ${resultsPath}`);

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

