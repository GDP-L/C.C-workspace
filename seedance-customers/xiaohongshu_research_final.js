
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

// 搜索关键词
const KEYWORDS = ['AI视频生成', '视频制作', '电商视频'];

async function main() {
  console.log('========================================');
  console.log('小红书 - 登录后调研');
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
  const results = {
    searchResults: [],
    timestamp: new Date().toISOString()
  };

  try {
    // 先访问小红书，看看是否已经登录（用户已经扫码登录了）
    console.log('正在访问小红书首页...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // 截图首页
    const homeScreenshot = path.join(WORK_DIR, 'xiaohongshu_research_home.png');
    await page.screenshot({ path: homeScreenshot, fullPage: true });
    console.log(`首页截图已保存: ${homeScreenshot}`);

    // 开始搜索
    console.log('\n开始搜索...');
    for (const keyword of KEYWORDS) {
      console.log(`\n搜索关键词: ${keyword}`);
      
      try {
        const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(8000);
        
        // 截图
        const screenshotPath = path.join(WORK_DIR, `xiaohongshu_research_${keyword}.png`);
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
    const resultsPath = path.join(WORK_DIR, 'xiaohongshu_research_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
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

