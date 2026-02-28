
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

// 搜索关键词
const KEYWORDS = ['AI视频生成', '视频制作', '电商视频'];

// Cookie文件路径
const COOKIES_PATH = path.join(WORK_DIR, 'xiaohongshu_cookies.json');

// 站大爷隧道代理配置（已验证成功）
const PROXY_CONFIG = {
  server: 'http://a963.zdtps.com:21166',
  username: '202602271335241351',
  password: 'rbsqmwrq'
};

async function main() {
  console.log('========================================');
  console.log('小红书 - 代理+Cookie调研');
  console.log('========================================\n');

  // 加载Cookie
  console.log('正在加载Cookie...');
  const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
  console.log(`✅ 加载了 ${cookies.length} 个Cookie\n`);

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    proxy: {
      server: PROXY_CONFIG.server,
      username: PROXY_CONFIG.username,
      password: PROXY_CONFIG.password
    }
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
  const allResults = {
    timestamp: new Date().toISOString(),
    keywords: {}
  };

  try {
    // 先访问首页确认
    console.log('正在访问小红书首页...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'load', timeout: 90000 });
    await page.waitForTimeout(5000);
    console.log('✅ 首页访问完成\n');

    // 逐个关键词搜索
    for (const keyword of KEYWORDS) {
      console.log(`\n========================================`);
      console.log(`搜索关键词: ${keyword}`);
      console.log(`========================================`);

      const keywordResult = {
        keyword: keyword,
        timestamp: new Date().toISOString()
      };

      try {
        const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
        console.log(`正在访问: ${searchUrl}`);
        
        await page.goto(searchUrl, { waitUntil: 'load', timeout: 90000 });
        await page.waitForTimeout(10000);

        // 截图保存
        const screenshotPath = path.join(WORK_DIR, `xiaohongshu_final_${keyword}.png`);
        try {
          await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 60000 });
          console.log(`✅ 截图已保存: ${screenshotPath}`);
          keywordResult.screenshot = screenshotPath;
        } catch (screenshotError) {
          console.log(`⚠️ 截图超时，跳过截图: ${screenshotError.message}`);
        }

        // 提取页面HTML长度
        const pageContent = await page.content();
        keywordResult.pageHtmlLength = pageContent.length;
        console.log(`✅ 页面HTML长度: ${pageContent.length}`);

        allResults.keywords[keyword] = keywordResult;
        console.log(`✅ 关键词 "${keyword}" 处理完成`);

      } catch (error) {
        console.error(`❌ 关键词 "${keyword}" 处理出错:`, error.message);
        keywordResult.error = error.message;
        allResults.keywords[keyword] = keywordResult;
      }

      // 关键词之间等待一下
      await page.waitForTimeout(5000);
    }

    // 保存结果
    const resultsPath = path.join(WORK_DIR, 'xiaohongshu_final_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2));
    console.log(`\n✅ 所有结果已保存到: ${resultsPath}`);

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

