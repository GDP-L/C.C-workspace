
const { chromium } = require('playwright');

// 站大爷隧道代理配置（curl测试成功的配置）
const PROXY_CONFIG = {
  server: 'http://a963.zdtps.com:21166',
  username: '202602271335241351',
  password: 'rbsqmwrq'
};

async function testTunnelProxy() {
  console.log('========================================');
  console.log('测试站大爷隧道代理（优化超时配置）');
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
    console.log('正在访问小红书...');
    const startTime = Date.now();
    
    // 放宽等待条件，超时时间增加到90秒
    await page.goto('https://www.xiaohongshu.com/', { 
      waitUntil: 'load', // 用load而不是domcontentloaded
      timeout: 90000 
    });
    const loadTime = Date.now() - startTime;
    
    const title = await page.title();
    const url = page.url();
    
    console.log('\n✅ 隧道代理测试成功！');
    console.log('页面标题:', title);
    console.log('页面URL:', url);
    console.log('加载时间:', loadTime + 'ms\n');

    // 截图保存
    const screenshotPath = '/root/.openclaw/workspace/seedance-customers/zdaye_tunnel_test.png';
    await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 60000 });
    console.log('✅ 截图已保存:', screenshotPath);
    
    await browser.close();
    return { success: true, title, url, loadTime, screenshotPath };
    
  } catch (error) {
    console.log('\n❌ 隧道代理测试失败:', error.message);
    await browser.close();
    return { success: false, error: error.message };
  }
}

testTunnelProxy();

