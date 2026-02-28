
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

// 文件路径
const STATE_PATH = path.join(WORK_DIR, 'xiaohongshu_logged_in_state.json');
const QRCODE_PATH = path.join(WORK_DIR, 'xiaohongshu_qrcode.png');

async function main() {
  console.log('========================================');
  console.log('小红书 - 登录流程（改进版）');
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
    await page.screenshot({ path: QRCODE_PATH, fullPage: true });
    console.log(`二维码已保存: ${QRCODE_PATH}`);
    console.log('\n========================================');
    console.log('请使用手机小红书APP扫码登录！');
    console.log('我会持续等待直到登录成功...');
    console.log('========================================\n');

    // 等待登录成功 - 通过检查是否不再显示登录相关元素，或者页面跳转到首页
    let loggedIn = false;
    let attempts = 0;
    const maxAttempts = 120; // 等待10分钟 (120 * 5秒)

    while (!loggedIn && attempts < maxAttempts) {
      attempts++;
      console.log(`等待登录中... (${attempts}/${maxAttempts})`);
      
      // 检查是否已经登录成功
      // 方法1: 检查是否有"登录"按钮消失
      // 方法2: 检查URL是否变化
      // 方法3: 检查是否有用户头像等元素
      const loginButtonVisible = await page.evaluate(() => {
        const loginTexts = ['登录', '扫码登录', '登录/注册'];
        for (const text of loginTexts) {
          const elements = Array.from(document.querySelectorAll('*')).filter(el => 
            el.textContent && el.textContent.includes(text) && el.offsetParent !== null
          );
          if (elements.length > 0) return true;
        }
        return false;
      });

      if (!loginButtonVisible) {
        loggedIn = true;
        break;
      }

      await page.waitForTimeout(5000);
    }

    if (!loggedIn) {
      throw new Error('登录超时，请重新运行脚本');
    }

    console.log('\n登录成功！');
    await page.waitForTimeout(3000);

    // 截图登录后的首页
    await page.screenshot({ path: path.join(WORK_DIR, 'xiaohongshu_logged_in_home.png'), fullPage: true });
    console.log('登录后首页截图已保存');

    // 保存浏览器状态（包含cookies和localStorage）
    await context.storageState({ path: STATE_PATH });
    console.log(`登录状态已保存到: ${STATE_PATH}`);

    console.log('\n========================================');
    console.log('登录流程完成！');
    console.log('现在可以运行调研脚本了！');
    console.log('========================================');

  } catch (error) {
    console.error('执行过程出错:', error);
  } finally {
    await browser.close();
  }
}

main();

