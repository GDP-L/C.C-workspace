
const { chromium } = require('playwright');

// 站大爷隧道代理配置
const PROXY_CONFIG = {
  server: 'http://a963.zdtps.com:21166', // 主服务器，HTTP端口
  username: '202602271335241351', // 用户名
  password: 'rbsqmwrq' // 密码
};

async function testProxyBaidu() {
  console.log('========================================');
  console.log('测试站大爷隧道代理（访问百度）');
  console.log('========================================\n');
  console.log('代理服务器:', PROXY_CONFIG.server);

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

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai'
    });

    const page = await context.newPage();
    console.log('正在访问百度...');
    const startTime = Date.now();
    
    await page.goto('https://www.baidu.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const loadTime = Date.now() - startTime;
    
    const title = await page.title();
    const url = page.url();
    
    console.log('\n✅ 代理测试成功！');
    console.log('页面标题:', title);
    console.log('页面URL:', url);
    console.log('加载时间:', loadTime + 'ms\n');

    // 截图保存
    const screenshotPath = '/root/.openclaw/workspace/seedance-customers/zdaye_baidu_test.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log('✅ 截图已保存:', screenshotPath);
    
    await browser.close();
    return { success: true, title, url, loadTime, screenshotPath };
    
  } catch (error) {
    console.log('\n❌ 代理测试失败:', error.message);
    await browser.close();
    return { success: false, error: error.message };
  }
}

testProxyBaidu();

