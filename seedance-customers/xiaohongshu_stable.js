
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

// 搜索关键词
const KEYWORDS = ['AI视频生成', '视频制作', '电商视频'];

// 创建 readline 接口用于用户输入
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 封装 readline.question 为 Promise
function question(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

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
  console.log('小红书 - 稳定版登录+调研');
  console.log('========================================\n');

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

  const page = await context.newPage();
  const results = {
    searchResults: [],
    timestamp: new Date().toISOString()
  };

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
    const qrcodeScreenshot = path.join(WORK_DIR, 'xiaohongshu_stable_qrcode.png');
    await page.screenshot({ path: qrcodeScreenshot, fullPage: true });
    console.log(`二维码页面截图已保存: ${qrcodeScreenshot}`);

    console.log('\n========================================');
    console.log('二维码已生成！');
    console.log('文件: xiaohongshu_stable_qrcode.png');
    console.log('========================================\n');

    // 等待用户确认已扫码
    const confirm = await question('请用手机小红书APP扫码后，输入 "ok" 继续: ');
    if (confirm.trim().toLowerCase() !== 'ok') {
      console.log('用户取消操作');
      return;
    }

    // 验证登录状态
    console.log('\n正在验证登录状态...');
    await page.waitForTimeout(10000);
    
    let loginSuccess = await checkLoginSuccess(page);
    
    // 如果未检测到登录状态，尝试刷新页面再检查
    if (!loginSuccess) {
      console.log('未检测到登录状态，刷新页面重新检查...');
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(10000);
      loginSuccess = await checkLoginSuccess(page);
    }
    
    if (!loginSuccess) {
      console.log('❌ 登录验证失败！请检查是否真的登录成功了？');
      
      // 保存当前页面截图供用户查看
      const failScreenshot = path.join(WORK_DIR, 'xiaohongshu_login_fail.png');
      await page.screenshot({ path: failScreenshot, fullPage: true });
      console.log(`失败页面截图已保存: ${failScreenshot}`);
      return;
    }

    console.log('✅ 登录验证成功！');

    // 截图首页（已登录状态）
    const homeScreenshot = path.join(WORK_DIR, 'xiaohongshu_stable_home.png');
    await page.screenshot({ path: homeScreenshot, fullPage: true });
    console.log(`已登录首页截图已保存: ${homeScreenshot}`);

    // 开始搜索
    console.log('\n开始搜索...');
    for (const keyword of KEYWORDS) {
      console.log(`\n搜索关键词: ${keyword}`);
      
      try {
        const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(8000);
        
        // 截图
        const screenshotPath = path.join(WORK_DIR, `xiaohongshu_stable_${keyword}.png`);
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
    const resultsPath = path.join(WORK_DIR, 'xiaohongshu_stable_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n结果已保存到: ${resultsPath}`);

    console.log('\n========================================');
    console.log('小红书调研完成！');
    console.log('========================================');

  } catch (error) {
    console.error('执行过程出错:', error);
  } finally {
    rl.close();
    await browser.close();
  }
}

main();

