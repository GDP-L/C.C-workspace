
const { chromium } = require('playwright');

// 免费代理IP列表（从站大爷提取）
const PROXIES = [
  { url: 'https://120.238.159.205:22222', desc: '广东江门移动，0.2秒，HTTPS' },
  { url: 'http://223.113.134.103:22222', desc: '江苏移动，0.1秒，HTTP' },
  { url: 'socks5://120.79.217.196:9000', desc: '广东深圳阿里云，0.1秒，SOCKS5' },
  { url: 'socks5://120.79.217.196:8082', desc: '广东深圳阿里云，0.1秒，SOCKS5' },
  { url: 'socks5://106.15.137.41:50', desc: '上海阿里云，0.1秒，SOCKS5' }
];

async function testProxy(proxy) {
  console.log(`\n========================================`);
  console.log(`测试代理: ${proxy.desc}`);
  console.log(`代理地址: ${proxy.url}`);
  console.log(`========================================`);

  const browser = await chromium.launch({
    executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    proxy: { server: proxy.url }
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
    
    await page.goto('https://www.xiaohongshu.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const loadTime = Date.now() - startTime;
    
    const title = await page.title();
    const url = page.url();
    
    console.log(`✅ 成功！`);
    console.log(`页面标题: ${title}`);
    console.log(`页面URL: ${url}`);
    console.log(`加载时间: ${loadTime}ms`);
    
    await browser.close();
    return { success: true, proxy, title, url, loadTime };
    
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`);
    await browser.close();
    return { success: false, proxy, error: error.message };
  }
}

async function main() {
  console.log('========================================');
  console.log('开始测试免费代理IP');
  console.log('========================================\n');

  const results = [];
  for (const proxy of PROXIES) {
    const result = await testProxy(proxy);
    results.push(result);
    // 代理之间等待一下
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n========================================');
  console.log('测试完成！结果总结:');
  console.log('========================================\n');
  
  const successProxies = results.filter(r => r.success);
  console.log(`✅ 成功的代理: ${successProxies.length}/${PROXIES.length}`);
  successProxies.forEach(r => {
    console.log(`  - ${r.proxy.desc}: ${r.url} (${r.loadTime}ms)`);
  });

  const failProxies = results.filter(r => !r.success);
  console.log(`\n❌ 失败的代理: ${failProxies.length}/${PROXIES.length}`);
  failProxies.forEach(r => {
    console.log(`  - ${r.proxy.desc}: ${r.error}`);
  });
}

main();

