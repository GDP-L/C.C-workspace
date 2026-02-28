const fs = require('fs');
const path = require('path');

const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';

// 读取调研结果
const researchResults = JSON.parse(
  fs.readFileSync(path.join(WORK_DIR, 'research_results.json'), 'utf-8')
);

console.log('========================================');
console.log('Seedance 2.0 潜在客户分析');
console.log('========================================\n');

// 分析B站的结果
const bilibiliResults = researchResults.platforms['B站'];
let potentialCustomers = [];

if (bilibiliResults) {
  console.log('📊 分析B站结果...\n');

  for (const searchResult of bilibiliResults.searchResults) {
    console.log(`🔍 关键词: ${searchResult.keyword}`);
    
    if (searchResult.extractedInfo && searchResult.extractedInfo.headings) {
      const headings = searchResult.extractedInfo.headings;
      
      // 分析每个标题，寻找潜在客户
      for (const heading of headings) {
        if (!heading || heading === '登录后你可以：') continue;

        // 评估匹配度
        let matchLevel = '低';
        let customerType = '';
        let needs = '';

        if (heading.includes('Seedance') || heading.includes('即梦') || heading.includes('豆包')) {
          matchLevel = '高';
          customerType = 'AI视频工具用户/创作者';
          needs = '使用AI视频生成工具进行创作';
        } else if (heading.includes('教程') || heading.includes('教学')) {
          matchLevel = '中';
          customerType = '学习者/教程创作者';
          needs = '学习视频制作技能';
        } else if (heading.includes('电商') || heading.includes('带货')) {
          matchLevel = '高';
          customerType = '电商从业者';
          needs = '制作电商产品视频';
        } else if (heading.includes('接单') || heading.includes('兼职') || heading.includes('副业')) {
          matchLevel = '高';
          customerType = '自由职业者/接单者';
          needs = '通过视频制作接单赚钱';
        } else if (heading.includes('广告') || heading.includes('营销')) {
          matchLevel = '中';
          customerType = '营销人员';
          needs = '制作营销视频';
        } else if (heading.includes('影视') || heading.includes('短片') || heading.includes('动画')) {
          matchLevel = '中';
          customerType = '影视创作者';
          needs = '创作影视内容';
        }

        if (matchLevel !== '低') {
          potentialCustomers.push({
            platform: 'B站',
            title: heading,
            customerType: customerType,
            needs: needs,
            matchLevel: matchLevel,
            keyword: searchResult.keyword,
            sourceUrl: searchResult.url
          });
        }
      }
    }
    console.log(`   找到 ${potentialCustomers.length} 个潜在客户\n`);
  }
}

// 按匹配度排序
potentialCustomers.sort((a, b) => {
  const order = { '高': 0, '中': 1, '低': 2 };
  return order[a.matchLevel] - order[b.matchLevel];
});

// 生成潜在客户列表
console.log('========================================');
console.log('📋 潜在客户列表');
console.log('========================================\n');

const highMatchCustomers = potentialCustomers.filter(c => c.matchLevel === '高');
const mediumMatchCustomers = potentialCustomers.filter(c => c.matchLevel === '中');

console.log(`🔥 高匹配度客户 (${highMatchCustomers.length}个):\n`);
highMatchCustomers.slice(0, 20).forEach((customer, index) => {
  console.log(`${index + 1}. [${customer.platform}] ${customer.title}`);
  console.log(`   类型: ${customer.customerType}`);
  console.log(`   需求: ${customer.needs}`);
  console.log(`   匹配度: ${customer.matchLevel}\n`);
});

console.log(`\n📊 中匹配度客户 (${mediumMatchCustomers.length}个):\n`);
mediumMatchCustomers.slice(0, 10).forEach((customer, index) => {
  console.log(`${index + 1}. [${customer.platform}] ${customer.title}`);
  console.log(`   类型: ${customer.customerType}`);
  console.log(`   需求: ${customer.needs}`);
  console.log(`   匹配度: ${customer.matchLevel}\n`);
});

// 保存潜在客户列表
const customersListPath = path.join(WORK_DIR, '潜在客户列表.json');
fs.writeFileSync(customersListPath, JSON.stringify(potentialCustomers, null, 2), 'utf-8');
console.log(`\n💾 潜在客户列表已保存到: ${customersListPath}`);

// 生成行业分类分析
const industryAnalysis = {
  '广告营销': potentialCustomers.filter(c => c.title.includes('广告') || c.title.includes('营销')),
  '电商': potentialCustomers.filter(c => c.title.includes('电商') || c.title.includes('带货')),
  '影视工作室': potentialCustomers.filter(c => c.title.includes('影视') || c.title.includes('短片') || c.title.includes('动画')),
  '教育机构': potentialCustomers.filter(c => c.title.includes('教程') || c.title.includes('教学') || c.title.includes('教育')),
  '游戏公司': potentialCustomers.filter(c => c.title.includes('游戏')),
  '自由职业者': potentialCustomers.filter(c => c.title.includes('接单') || c.title.includes('兼职') || c.title.includes('副业'))
};

// 生成Markdown报告
let markdownReport = `# Seedance 2.0 潜在客户分析报告\n\n`;
markdownReport += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

markdownReport += `## 📊 平台调研结论\n\n`;
markdownReport += `**B站**是拥有最多潜在客户的平台，发现了大量与AI视频生成、视频制作相关的内容。\n\n`;

markdownReport += `## 👥 潜在客户统计\n\n`;
markdownReport += `- 总计发现: ${potentialCustomers.length} 个潜在客户\n`;
markdownReport += `- 高匹配度: ${highMatchCustomers.length} 个\n`;
markdownReport += `- 中匹配度: ${mediumMatchCustomers.length} 个\n\n`;

markdownReport += `## 🏭 行业分类分析\n\n`;
for (const [industry, customers] of Object.entries(industryAnalysis)) {
  markdownReport += `### ${industry}\n`;
  markdownReport += `- 客户数量: ${customers.length}\n`;
  if (customers.length > 0) {
    markdownReport += `- 代表性客户:\n`;
    customers.slice(0, 3).forEach(c => {
      markdownReport += `  - ${c.title.substring(0, 50)}...\n`;
    });
  }
  markdownReport += `\n`;
}

markdownReport += `## 🔥 高匹配度潜在客户 (Top 20)\n\n`;
highMatchCustomers.slice(0, 20).forEach((customer, index) => {
  markdownReport += `### ${index + 1}. ${customer.title.substring(0, 60)}\n\n`;
  markdownReport += `- **平台**: ${customer.platform}\n`;
  markdownReport += `- **客户类型**: ${customer.customerType}\n`;
  markdownReport += `- **需求描述**: ${customer.needs}\n`;
  markdownReport += `- **匹配度**: ${customer.matchLevel}\n`;
  markdownReport += `- **搜索关键词**: ${customer.keyword}\n\n`;
});

markdownReport += `## 💡 触达建议\n\n`;
markdownReport += `### 针对不同客户类型的沟通策略:\n\n`;

markdownReport += `#### 1. AI视频工具用户/创作者\n`;
markdownReport += `- **价值点**: Seedance 2.0的多模态素材融合、精准意图理解\n`;
markdownReport += `- **沟通话术**: "看到您在使用AI视频工具，Seedance 2.0在多主体一致性控制和人物微表情控制方面有独特优势，想不想了解一下？"\n\n`;

markdownReport += `#### 2. 电商从业者\n`;
markdownReport += `- **价值点**: 快速生成高质量电商产品视频，提升转化率\n`;
markdownReport += `- **沟通话术**: "您在做电商视频，Seedance 2.0可以一键生成专业的产品展示视频，大大提升您的制作效率！"\n\n`;

markdownReport += `#### 3. 自由职业者/接单者\n`;
markdownReport += `- **价值点**: 提高接单效率，增加收入来源\n`;
markdownReport += `- **沟通话术**: "您在接单做视频，用Seedance 2.0可以让您的工作效率提升数倍，接更多的订单！"\n\n`;

markdownReport += `#### 4. 学习者/教程创作者\n`;
markdownReport += `- **价值点**: 易学易用，强大的视频编辑能力\n`;
markdownReport += `- **沟通话术**: "您在学习/教授视频制作，Seedance 2.0有保姆级教程，可以让您快速掌握AI视频创作！"\n\n`;

markdownReport += `---\n\n`;
markdownReport += `*报告生成完成*\n`;

const analysisReportPath = path.join(WORK_DIR, '潜在客户分析报告.md');
fs.writeFileSync(analysisReportPath, markdownReport, 'utf-8');
console.log(`📄 分析报告已保存到: ${analysisReportPath}`);

console.log('\n========================================');
console.log('✅ 分析完成!');
console.log('========================================');
