
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';
const COOKIES_PATH = path.join(WORK_DIR, 'xiaohongshu_final_cookies.json');

// 搜索关键词
const KEYWORDS = ['AI视频生成', '视频制作', '电商视频'];

async function main() {
  console.log('========================================');
  console.log('小红书登录调研 - 最终版');
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
  const results = {
    loginSuccess: false,
    searchResults: [],
    potentialCustomers: [],
    timestamp: new Date().toISOString()
  };

  try {
    // 访问小红书首页
    console.log('正在访问小红书首页...');
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // 等待页面加载
    await page.waitForTimeout(5000);

    // 截图首页
    const homeScreenshot = path.join(WORK_DIR, 'xiaohongshu_final_home.png');
    await page.screenshot({ path: homeScreenshot, fullPage: true });
    console.log(`首页截图已保存: ${homeScreenshot}`);

    // 检查是否已登录
    console.log('检查登录状态...');
    const isLoggedIn = await checkLoginStatus(page);
    
    if (isLoggedIn) {
      console.log('✅ 检测到已登录状态！');
      results.loginSuccess = true;
    } else {
      console.log('需要登录，正在找登录按钮...');
      
      // 找登录按钮
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

      // 等待登录弹窗
      await page.waitForTimeout(3000);

      // 截图登录页面
      const loginScreenshot = path.join(WORK_DIR, 'xiaohongshu_final_login.png');
      await page.screenshot({ path: loginScreenshot, fullPage: true });
      console.log(`登录页面截图已保存: ${loginScreenshot}`);

      // 找扫码登录
      const qrcodeSelectors = [
        'text=扫码登录',
        'text=二维码',
        'text=扫码',
        'button:has-text("扫码")',
        'button:has-text("二维码")'
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

      // 等待二维码加载
      await page.waitForTimeout(5000);

      // 截图二维码页面
      const qrcodeScreenshot = path.join(WORK_DIR, 'xiaohongshu_final_qrcode.png');
      await page.screenshot({ path: qrcodeScreenshot, fullPage: true });
      console.log(`二维码页面截图已保存: ${qrcodeScreenshot}`);

      console.log('\n========================================');
      console.log('请用手机小红书APP扫码登录！');
      console.log('扫码后我会继续执行...');
      console.log('========================================\n');

      // 等待用户扫码 - 这里我们假设用户已经扫码了，直接继续
      await page.waitForTimeout(10000);

      // 再次检查登录状态
      const isLoggedInAfter = await checkLoginStatus(page);
      if (isLoggedInAfter) {
        console.log('✅ 登录成功！');
        results.loginSuccess = true;
      } else {
        console.log('⚠️ 无法确认登录状态，尝试继续...');
      }
    }

    // 保存cookies
    const cookies = await context.cookies();
    fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2), 'utf-8');
    console.log('Cookies已保存');

    // 截图登录后的页面
    const loggedInScreenshot = path.join(WORK_DIR, 'xiaohongshu_final_loggedin.png');
    await page.screenshot({ path: loggedInScreenshot, fullPage: true });
    console.log(`登录后截图已保存: ${loggedInScreenshot}`);

    // 开始调研
    console.log('\n========================================');
    console.log('开始调研小红书...');
    console.log('========================================\n');

    for (const keyword of KEYWORDS) {
      console.log(`\n搜索关键词: ${keyword}`);
      
      try {
        const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
        // 等待页面加载
        await page.waitForTimeout(8000);
        
        // 截图
        const screenshotPath = path.join(WORK_DIR, `xiaohongshu_final_${keyword}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`截图已保存: ${screenshotPath}`);
        
        // 提取页面信息
        const pageInfo = await extractPageInfo(page, keyword);
        
        results.searchResults.push({
          keyword: keyword,
          url: searchUrl,
          screenshot: screenshotPath,
          pageInfo: pageInfo
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

    // 保存最终结果
    const resultsPath = path.join(WORK_DIR, 'xiaohongshu_final_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\n最终结果已保存到: ${resultsPath}`);

    // 保存总结报告
    await saveFinalReport(results, WORK_DIR);

    console.log('\n========================================');
    console.log('小红书调研任务完成！');
    console.log('========================================');

  } catch (error) {
    console.error('执行过程出错:', error);
    
    // 截图错误页面
    try {
      const errorScreenshot = path.join(WORK_DIR, 'xiaohongshu_final_error.png');
      await page.screenshot({ path: errorScreenshot, fullPage: true });
      console.log(`错误页面截图已保存: ${errorScreenshot}`);
    } catch (e) {
      console.log('无法截图错误页面');
    }
  } finally {
    await browser.close();
  }
}

async function checkLoginStatus(page) {
  try {
    const hasUserElement = await page.evaluate(() =&gt; {
      const selectors = [
        '.user-avatar', 
        '.avatar',
        '.user-info',
        '.username',
        '[class*="user"]',
        '[class*="avatar"]'
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length &gt; 0) {
          return true;
        }
      }
      return false;
    });
    
    return hasUserElement;
  } catch (error) {
    console.log('检查登录状态出错:', error.message);
    return false;
  }
}

async function extractPageInfo(page, keyword) {
  try {
    const info = await page.evaluate(([kw]) =&gt; {
      return {
        title: document.title,
        url: window.location.href,
        contentLength: document.body.innerText.length,
        links: Array.from(document.querySelectorAll('a'))
          .filter(a =&gt; a.href &amp;&amp; a.textContent)
          .slice(0, 30)
          .map(a =&gt; ({
            text: a.textContent.trim().substring(0, 100),
            href: a.href
          })),
        headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, .title, .note-title'))
          .filter(h =&gt; h.textContent &amp;&amp; h.textContent.trim())
          .slice(0, 20)
          .map(h =&gt; h.textContent.trim())
      };
    }, [keyword]);
    
    return info;
  } catch (error) {
    console.log('提取页面信息出错:', error.message);
    return { error: error.message };
  }
}

async function saveFinalReport(results, workDir) {
  const reportPath = path.join(workDir, '小红书最终调研报告.md');
  let report = `# 小红书最终调研报告\n\n`;
  report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  report += `## 登录状态\n\n`;
  report += `- 登录成功: ${results.loginSuccess ? '✅ 是' : '❌ 否'}\n\n`;
  report += `## 搜索结果\n\n`;
  
  for (const result of results.searchResults) {
    report += `### 关键词: ${result.keyword}\n\n`;
    if (result.error) {
      report += `- 错误: ${result.error}\n\n`;
    } else {
      report += `- URL: ${result.url}\n`;
      report += `- 截图: ${result.screenshot}\n`;
      if (result.pageInfo &amp;&amp; result.pageInfo.title) {
        report += `- 页面标题: ${result.pageInfo.title}\n`;
      }
      if (result.pageInfo &amp;&amp; result.pageInfo.headings) {
        report += `- 提取的标题:\n`;
        result.pageInfo.headings.forEach((heading, idx) =&gt; {
          report += `  ${idx + 1}. ${heading}\n`;
        });
      }
      report += `\n`;
    }
  }
  
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`最终报告已保存到: ${reportPath}`);
}

main();

