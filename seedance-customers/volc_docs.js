
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

const DOCS = [
  {
    name: '图片理解',
    url: 'https://www.volcengine.com/docs/82379/1362931?lang=zh'
  },
  {
    name: '视频理解',
    url: 'https://www.volcengine.com/docs/82379/1895586?lang=zh'
  },
  {
    name: '文档理解',
    url: 'https://www.volcengine.com/docs/82379/1902647?lang=zh'
  }
];

async function main() {
  console.log('========================================');
  console.log('火山引擎文档 - 获取完整内容');
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
    for (const doc of DOCS) {
      console.log(`\n正在访问: ${doc.name}`);
      console.log(`URL: ${doc.url}`);
      
      await page.goto(doc.url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(5000);
      
      // 截图
      const screenshotPath = path.join(WORK_DIR, `volc_${doc.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ 截图已保存: ${screenshotPath}`);
      
      // 提取文本内容
      const textContent = await page.evaluate(() =&gt; {
        return document.body.innerText;
      });
      
      const textPath = path.join(WORK_DIR, `volc_${doc.name}.txt`);
      fs.writeFileSync(textPath, textContent, 'utf-8');
      console.log(`✅ 文本内容已保存: ${textPath}`);
      
      await page.waitForTimeout(2000);
    }

    console.log('\n========================================');
    console.log('所有文档获取完成！');
    console.log('========================================');

  } catch (error) {
    console.error('执行过程出错:', error);
  } finally {
    await browser.close();
  }
}

main();

