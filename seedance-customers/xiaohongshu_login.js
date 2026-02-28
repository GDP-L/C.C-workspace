
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';
const COOKIES_PATH = path.join(WORK_DIR, 'xiaohongshu_cookies.json');

// 搜索关键词
const KEYWORDS = ['AI视频生成', '视频制作', '电商视频'];

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class XiaohongshuResearcher {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.results = {
      loginStatus: false,
      searchResults: [],
      potentialCustomers: [],
      timestamp: new Date().toISOString()
    };
  }

  async init(headless = false) {
    console.log('正在启动浏览器...');
    
    // 启动浏览器
    this.browser = await chromium.launch({
      executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
      headless: headless
    });

    // 创建浏览器上下文
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai'
    });

    // 尝试加载保存的 cookies
    if (fs.existsSync(COOKIES_PATH)) {
      try {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
        await this.context.addCookies(cookies);
        console.log('已加载保存的 cookies');
      } catch (error) {
        console.log('加载 cookies 失败:', error.message);
      }
    }

    this.page = await this.context.newPage();
    console.log('浏览器已启动');
  }

  async login() {
    console.log('\n========================================');
    console.log('正在访问小红书网站...');
    console.log('========================================\n');

    try {
      // 访问小红书首页
      await this.page.goto('https://www.xiaohongshu.com/', { waitUntil: 'networkidle', timeout: 30000 });
      
      // 截图
      const screenshotPath = path.join(WORK_DIR, 'xiaohongshu_home.png');
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`首页截图已保存: ${screenshotPath}`);

      // 检查是否已经登录
      const isLoggedIn = await this.checkLoginStatus();
      
      if (isLoggedIn) {
        console.log('检测到已登录状态！');
        this.results.loginStatus = true;
        return true;
      }

      console.log('需要登录，正在查找登录入口...');
      
      // 尝试点击登录按钮
      await this.tryFindLoginButton();
      
      // 等待用户输入验证码
      console.log('\n========================================');
      console.log('验证码已发送，请在群里提供验证码');
      console.log('========================================\n');
      
      return 'wait_for_verification';
      
    } catch (error) {
      console.error('登录过程出错:', error.message);
      return false;
    }
  }

  async checkLoginStatus() {
    try {
      // 检查是否有用户头像或用户名等登录状态的元素
      const hasUserElement = await this.page.evaluate(() => {
        // 查找可能的登录状态元素
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
          if (elements.length > 0) {
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

  async tryFindLoginButton() {
    try {
      // 尝试多种可能的登录按钮选择器
      const loginSelectors = [
        'button:has-text("登录")',
        'a:has-text("登录")',
        '.login-btn',
        '.login-button',
        '[class*="login"]',
        'text=登录'
      ];
      
      for (const selector of loginSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            console.log(`找到登录按钮: ${selector}`);
            await element.click();
            await this.page.waitForTimeout(2000);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // 截图登录页面
      const loginScreenshot = path.join(WORK_DIR, 'xiaohongshu_login_page.png');
      await this.page.screenshot({ path: loginScreenshot, fullPage: true });
      console.log(`登录页面截图已保存: ${loginScreenshot}`);
      
      // 尝试找到手机号输入框
      await this.enterPhoneNumber();
      
    } catch (error) {
      console.log('查找登录按钮出错:', error.message);
    }
  }

  async enterPhoneNumber() {
    try {
      console.log('正在输入手机号: 18520812796');
      
      // 尝试多种手机号输入框选择器
      const phoneSelectors = [
        'input[type="tel"]',
        'input[placeholder*="手机"]',
        'input[placeholder*="手机号"]',
        'input[name*="phone"]',
        'input[name*="mobile"]'
      ];
      
      let phoneInput = null;
      for (const selector of phoneSelectors) {
        try {
          phoneInput = await this.page.$(selector);
          if (phoneInput) {
            console.log(`找到手机号输入框: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (phoneInput) {
        await phoneInput.fill('18520812796');
        console.log('手机号已输入');
        
        // 尝试找到发送验证码按钮
        await this.clickSendCodeButton();
      } else {
        console.log('未找到手机号输入框，尝试直接输入');
        await this.page.keyboard.type('18520812796');
      }
      
    } catch (error) {
      console.log('输入手机号出错:', error.message);
    }
  }

  async clickSendCodeButton() {
    try {
      console.log('正在查找发送验证码按钮...');
      
      // 尝试多种发送验证码按钮选择器
      const codeSelectors = [
        'button:has-text("发送验证码")',
        'button:has-text("获取验证码")',
        'a:has-text("发送验证码")',
        'a:has-text("获取验证码")',
        '.send-code-btn',
        '.get-code-btn',
        'text=发送验证码',
        'text=获取验证码'
      ];
      
      for (const selector of codeSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            console.log(`找到发送验证码按钮: ${selector}`);
            await element.click();
            console.log('已点击发送验证码按钮！');
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      // 截图验证码发送后的页面
      const codeScreenshot = path.join(WORK_DIR, 'xiaohongshu_code_sent.png');
      await this.page.screenshot({ path: codeScreenshot, fullPage: true });
      console.log(`验证码发送后截图已保存: ${codeScreenshot}`);
      
    } catch (error) {
      console.log('点击发送验证码按钮出错:', error.message);
    }
  }

  async enterVerificationCode(code) {
    try {
      console.log(`正在输入验证码: ${code}`);
      
      // 尝试多种验证码输入框选择器
      const codeSelectors = [
        'input[placeholder*="验证码"]',
        'input[name*="code"]',
        'input[name*="verify"]'
      ];
      
      let codeInput = null;
      for (const selector of codeSelectors) {
        try {
          codeInput = await this.page.$(selector);
          if (codeInput) {
            console.log(`找到验证码输入框: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }
      
      if (codeInput) {
        await codeInput.fill(code);
      } else {
        await this.page.keyboard.type(code);
      }
      
      // 尝试点击登录按钮
      await this.clickLoginConfirmButton();
      
    } catch (error) {
      console.log('输入验证码出错:', error.message);
    }
  }

  async clickLoginConfirmButton() {
    try {
      console.log('正在查找登录确认按钮...');
      
      // 尝试多种登录确认按钮选择器
      const loginSelectors = [
        'button:has-text("登录")',
        'button:has-text("确认登录")',
        'button:has-text("登录")',
        '.login-confirm-btn',
        'text=登录',
        'text=确认登录'
      ];
      
      for (const selector of loginSelectors) {
        try {
          const element = await this.page.$(selector);
          if (element) {
            console.log(`找到登录确认按钮: ${selector}`);
            await element.click();
            console.log('已点击登录确认按钮！');
            break;
          }
        } catch (e) {
            continue;
          }
      }
      
      // 等待登录完成
      await this.page.waitForTimeout(5000);
      
      // 保存 cookies
      await this.saveCookies();
      
      // 截图登录后的页面
      const loggedInScreenshot = path.join(WORK_DIR, 'xiaohongshu_logged_in.png');
      await this.page.screenshot({ path: loggedInScreenshot, fullPage: true });
      console.log(`登录后截图已保存: ${loggedInScreenshot}`);
      
      this.results.loginStatus = true;
      
    } catch (error) {
      console.log('点击登录确认按钮出错:', error.message);
    }
  }

  async saveCookies() {
    try {
      const cookies = await this.context.cookies();
      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2), 'utf-8');
      console.log('Cookies 已保存');
    } catch (error) {
      console.log('保存 cookies 出错:', error.message);
    }
  }

  async research() {
    console.log('\n========================================');
    console.log('开始调研小红书...');
    console.log('========================================\n');

    for (const keyword of KEYWORDS) {
      console.log(`\n搜索关键词: ${keyword}`);
      
      try {
        const searchUrl = `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(keyword)}`;
        await this.page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
        
        // 截图
        const screenshotPath = path.join(WORK_DIR, `screenshot_小红书_${keyword}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`截图已保存: ${screenshotPath}`);
        
        // 提取信息
        const pageInfo = await this.extractPageInfo(keyword);
        
        this.results.searchResults.push({
          keyword: keyword,
          url: searchUrl,
          screenshot: screenshotPath,
          pageInfo: pageInfo
        });
        
        // 等待一下再进行下一个搜索
        await this.page.waitForTimeout(3000);
        
      } catch (error) {
        console.error(`搜索出错: ${error.message}`);
        this.results.searchResults.push({
          keyword: keyword,
          error: error.message
        });
      }
    }
  }

  async extractPageInfo(keyword) {
    try {
      const info = await this.page.evaluate(([kw]) => {
        return {
          title: document.title,
          url: window.location.href,
          contentLength: document.body.innerText.length,
          links: Array.from(document.querySelectorAll('a'))
            .filter(a => a.href && a.textContent)
            .slice(0, 20)
            .map(a => ({
              text: a.textContent.trim().substring(0, 100),
              href: a.href
            })),
          headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, .title'))
            .filter(h => h.textContent && h.textContent.trim())
            .slice(0, 15)
            .map(h => h.textContent.trim())
        };
      }, [keyword]);
      
      return info;
    } catch (error) {
      console.log('提取页面信息出错:', error.message);
      return { error: error.message };
    }
  }

  saveResults() {
    const resultsPath = path.join(WORK_DIR, 'xiaohongshu_research_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2), 'utf-8');
    console.log(`\n调研结果已保存到: ${resultsPath}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('浏览器已关闭');
    }
    rl.close();
  }
}

async function main() {
  console.log('========================================');
  console.log('小红书登录调研任务');
  console.log('========================================\n');

  const researcher = new XiaohongshuResearcher();
  
  try {
    await researcher.init(false); // 非无头模式，方便调试
    
    const loginResult = await researcher.login();
    
    if (loginResult === 'wait_for_verification') {
      // 等待用户输入验证码
      console.log('\n请在群里提供验证码，然后继续...');
      
      // 这里我们先保存当前状态，等待用户输入验证码后再继续
      // 实际使用时，可以通过其他方式获取验证码
      
      // 先保存当前页面截图
      const currentScreenshot = path.join(WORK_DIR, 'xiaohongshu_current_state.png');
      await researcher.page.screenshot({ path: currentScreenshot, fullPage: true });
      console.log(`当前状态截图已保存: ${currentScreenshot}`);
      
      // 保存 cookies
      await researcher.saveCookies();
      
      console.log('\n验证码已发送！请在群里提供验证码，然后我将继续完成登录和调研。');
      
    } else if (loginResult === true) {
      // 已经登录，直接进行调研
      await researcher.research();
      researcher.saveResults();
    }
    
  } catch (error) {
    console.error('执行过程出错:', error);
  } finally {
    // 不立即关闭浏览器，保持页面打开等待用户输入验证码
    console.log('\n浏览器保持打开状态，请提供验证码...');
  }
}

main();
