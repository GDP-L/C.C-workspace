
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

// 搜索关键词
const KEYWORDS = ['AI视频生成', '视频制作', '电商视频'];

// 默认手机号
const DEFAULT_PHONE = '18520812796';

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

async function loginWithPhone(page) {
  console.log('\n========================================');
  console.log('手机号+验证码登录');
  console.log('========================================\n');

  // 使用默认手机号或让用户输入
  const phone = await question(`请输入手机号 (默认: ${DEFAULT_PHONE}): `);
  const finalPhone = phone.trim() || DEFAULT_PHONE;
  console.log(`使用手机号: ${finalPhone}`);

  // 查找手机号输入框
  console.log('正在查找手机号输入框...');
  const phoneInputSelectors = [
    'input[type="tel"]',
    'input[name*="phone"]',
    'input[name*="mobile"]',
    'input[placeholder*="手机号"]',
    'input[placeholder*="手机号码"]'
  ];

  let phoneInput = null;
  for (const selector of phoneInputSelectors) {
    try {
      phoneInput = await page.$(selector);
      if (phoneInput) {
        console.log(`找到手机号输入框: ${selector}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!phoneInput) {
    console.log('❌ 未找到手机号输入框，尝试查找切换登录方式按钮...');
    
    // 尝试查找手机号登录切换按钮
    const switchSelectors = [
      'text=手机号登录',
      'text=手机登录',
      'text=短信登录'
    ];

    for (const selector of switchSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`找到切换按钮: ${selector}`);
          await element.click();
          await page.waitForTimeout(2000);
          
          // 再次尝试查找手机号输入框
          for (const selector2 of phoneInputSelectors) {
            try {
              phoneInput = await page.$(selector2);
              if (phoneInput) {
                console.log(`找到手机号输入框: ${selector2}`);
                break;
              }
            } catch (e) {
              continue;
            }
          }
          break;
        }
      } catch (e) {
        continue;
      }
    }
  }

  if (!phoneInput) {
    console.log('❌ 未能找到手机号输入框');
    return false;
  }

  // 输入手机号
  await phoneInput.fill(finalPhone);
  console.log('✅ 手机号已输入');

  // 查找发送验证码按钮
  console.log('正在查找发送验证码按钮...');
  const codeButtonSelectors = [
    'text=获取验证码',
    'text=发送验证码',
    'text=获取',
    'button:has-text("获取")',
    'button:has-text("验证码")'
  ];

  let codeButton = null;
  for (const selector of codeButtonSelectors) {
    try {
      codeButton = await page.$(selector);
      if (codeButton) {
        console.log(`找到发送验证码按钮: ${selector}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (codeButton) {
    await codeButton.click();
    console.log('✅ 验证码发送请求已触发');
    await page.waitForTimeout(2000);
  } else {
    console.log('⚠️ 未找到发送验证码按钮，继续下一步');
  }

  // 让用户输入验证码
  const code = await question('请输入收到的验证码: ');

  // 查找验证码输入框
  console.log('正在查找验证码输入框...');
  const verifyCodeInputSelectors = [
    'input[name*="code"]',
    'input[name*="verify"]',
    'input[placeholder*="验证码"]',
    'input[placeholder*="校验码"]'
  ];

  let verifyCodeInput = null;
  for (const selector of verifyCodeInputSelectors) {
    try {
      verifyCodeInput = await page.$(selector);
      if (verifyCodeInput) {
        console.log(`找到验证码输入框: ${selector}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (!verifyCodeInput) {
    console.log('❌ 未找到验证码输入框');
    return false;
  }

  // 输入验证码
  await verifyCodeInput.fill(code.trim());
  console.log('✅ 验证码已输入');

  // 查找登录按钮并点击
  console.log('正在查找登录按钮...');
  const loginButtonSelectors = [
    'button:has-text("登录")',
    'text=登录',
    'button[type="submit"]'
  ];

  let loginButton = null;
  for (const selector of loginButtonSelectors) {
    try {
      loginButton = await page.$(selector);
      if (loginButton) {
        console.log(`找到登录按钮: ${selector}`);
        break;
      }
    } catch (e) {
      continue;
    }
  }

  if (loginButton) {
    await loginButton.click();
    console.log('✅ 登录请求已触发');
    return true;
  } else {
    console.log('❌ 未找到登录按钮');
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('小红书 - 手机号验证码登录优化版');
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

    // 直接使用手机号验证码登录（默认方式）
    const loginInitiated = await loginWithPhone(page);

    if (!loginInitiated) {
      console.log('❌ 登录流程初始化失败');
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

