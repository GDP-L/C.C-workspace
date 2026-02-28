const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

// 确保目录存在
if (!fs.existsSync(WORK_DIR)) {
  fs.mkdirSync(WORK_DIR, { recursive: true });
}

// 调研平台列表
const PLATFORMS = [
  { name: '微博', url: 'https://s.weibo.com/', searchUrls: [
    { keyword: 'AI视频生成', url: 'https://s.weibo.com/weibo?q=AI视频生成' },
    { keyword: '文生视频', url: 'https://s.weibo.com/weibo?q=文生视频' },
    { keyword: '图生视频', url: 'https://s.weibo.com/weibo?q=图生视频' }
  ]},
  { name: '知乎', url: 'https://www.zhihu.com/', searchUrls: [
    { keyword: 'AI视频生成', url: 'https://www.zhihu.com/search?q=AI视频生成' },
    { keyword: '视频制作', url: 'https://www.zhihu.com/search?q=视频制作' },
    { keyword: '广告视频', url: 'https://www.zhihu.com/search?q=广告视频' }
  ]},
  { name: 'B站', url: 'https://www.bilibili.com/', searchUrls: [
    { keyword: 'AI视频生成', url: 'https://search.bilibili.com/all?keyword=AI视频生成' },
    { keyword: '视频制作教程', url: 'https://search.bilibili.com/all?keyword=视频制作教程' },
    { keyword: '电商视频', url: 'https://search.bilibili.com/all?keyword=电商视频' }
  ]},
  { name: '小红书', url: 'https://www.xiaohongshu.com/', searchUrls: [
    { keyword: 'AI视频生成', url: 'https://www.xiaohongshu.com/search_result?keyword=AI视频生成' },
    { keyword: '视频制作', url: 'https://www.xiaohongshu.com/search_result?keyword=视频制作' }
  ]}
];

// 搜索关键词
const KEYWORDS = [
  'AI视频生成', '文生视频', '图生视频', '视频制作',
  '广告视频', '电商视频', '教育视频', '影视创作'
];

// 行业分类
const INDUSTRIES = ['广告营销', '电商', '影视工作室', '教育机构', '游戏公司'];

class PlatformResearcher {
  constructor() {
    this.browser = null;
    this.context = null;
    this.results = {
      platforms: {},
      potentialCustomers: [],
      researchLog: []
    };
  }

  async init() {
    console.log('正在启动浏览器...');
    this.browser = await chromium.launch({
      executablePath: '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
      headless: true
    });

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'zh-CN',
      timezoneId: 'Asia/Shanghai'
    });

    console.log('浏览器已启动');
  }

  async researchPlatform(platform) {
    console.log(`\n========================================`);
    console.log(`正在调研平台: ${platform.name}`);
    console.log(`========================================`);

    const platformResult = {
      name: platform.name,
      url: platform.url,
      searchResults: [],
      potentialLeads: [],
      timestamp: new Date().toISOString()
    };

    for (const searchUrl of platform.searchUrls) {
      console.log(`\n搜索关键词: ${searchUrl.keyword}`);
      console.log(`访问URL: ${searchUrl.url}`);

      try {
        const page = await this.context.newPage();
        await page.goto(searchUrl.url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // 截图保存
        const screenshotPath = path.join(WORK_DIR, `screenshot_${platform.name}_${searchUrl.keyword}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`截图已保存: ${screenshotPath}`);

        // 获取页面内容
        const content = await page.content();
        const title = await page.title();
        console.log(`页面标题: ${title}`);
        console.log(`页面内容长度: ${content.length} 字符`);

        // 尝试提取一些信息
        const extractedInfo = await this.extractInfo(page, platform.name, searchUrl.keyword);
        
        platformResult.searchResults.push({
          keyword: searchUrl.keyword,
          url: searchUrl.url,
          title: title,
          contentLength: content.length,
          screenshot: screenshotPath,
          extractedInfo: extractedInfo
        });

        await page.close();
        
      } catch (error) {
        console.error(`访问出错: ${error.message}`);
        platformResult.searchResults.push({
          keyword: searchUrl.keyword,
          url: searchUrl.url,
          error: error.message
        });
      }
    }

    this.results.platforms[platform.name] = platformResult;
    this.log(`完成平台调研: ${platform.name}`);
  }

  async extractInfo(page, platformName, keyword) {
    try {
      // 根据不同平台使用不同的提取策略
      const info = await page.evaluate(([platform, kw]) => {
        const results = {
          links: [],
          headings: [],
          usernames: []
        };

        // 提取所有链接
        const allLinks = Array.from(document.querySelectorAll('a'));
        results.links = allLinks
          .filter(a => a.href && a.textContent && a.textContent.trim().length > 3)
          .slice(0, 20)
          .map(a => ({
            text: a.textContent.trim().substring(0, 100),
            href: a.href
          }));

        // 提取标题
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, .title, .content-title'));
        results.headings = headings
          .filter(h => h.textContent && h.textContent.trim().length > 5)
          .slice(0, 15)
          .map(h => h.textContent.trim());

        return results;
      }, [platformName, keyword]);

      return info;
    } catch (error) {
      console.error(`提取信息出错: ${error.message}`);
      return { error: error.message };
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    this.results.researchLog.push(logEntry);
  }

  saveResults() {
    const resultsPath = path.join(WORK_DIR, 'research_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2), 'utf-8');
    console.log(`\n调研结果已保存到: ${resultsPath}`);

    // 同时保存Markdown格式的报告
    this.saveMarkdownReport();
  }

  saveMarkdownReport() {
    const reportPath = path.join(WORK_DIR, '平台调研报告.md');
    let report = `# Seedance 2.0 潜在客户平台调研报告\n\n`;
    report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    report += `## 调研平台\n\n`;

    for (const platformName of Object.keys(this.results.platforms)) {
      const platform = this.results.platforms[platformName];
      report += `### ${platform.name}\n\n`;
      report += `- URL: ${platform.url}\n`;
      report += `- 调研时间: ${platform.timestamp}\n\n`;

      for (const searchResult of platform.searchResults) {
        report += `#### 关键词: ${searchResult.keyword}\n\n`;
        if (searchResult.error) {
          report += `- 错误: ${searchResult.error}\n\n`;
        } else {
          report += `- 页面标题: ${searchResult.title}\n`;
          report += `- 内容长度: ${searchResult.contentLength} 字符\n`;
          report += `- 截图: ${searchResult.screenshot}\n\n`;

          if (searchResult.extractedInfo && searchResult.extractedInfo.headings) {
            report += `##### 提取的标题:\n\n`;
            searchResult.extractedInfo.headings.forEach((heading, idx) => {
              report += `${idx + 1}. ${heading}\n`;
            });
            report += `\n`;
          }
        }
      }
      report += `---\n\n`;
    }

    report += `## 调研日志\n\n`;
    this.results.researchLog.forEach(log => {
      report += `- ${log}\n`;
    });

    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`Markdown报告已保存到: ${reportPath}`);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('浏览器已关闭');
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('Seedance 2.0 潜在客户平台调研');
  console.log('========================================\n');

  const researcher = new PlatformResearcher();
  
  try {
    await researcher.init();
    
    // 调研各个平台
    for (const platform of PLATFORMS) {
      await researcher.researchPlatform(platform);
      // 平台间稍作延迟
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 保存结果
    researcher.saveResults();
    
  } catch (error) {
    console.error('调研过程出错:', error);
  } finally {
    await researcher.close();
  }

  console.log('\n========================================');
  console.log('平台调研完成!');
  console.log('========================================');
}

main();
