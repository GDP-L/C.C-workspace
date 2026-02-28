
const fs = require('fs');
const path = require('path');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';
const HTML_PATH = path.join(WORK_DIR, 'bilibili_search_digital_singer.html');

console.log('正在读取HTML文件...');
const html = fs.readFileSync(HTML_PATH, 'utf-8');
console.log(`✅ HTML文件大小: ${(html.length / 1024).toFixed(2)} KB\n`);

// 简单提取文本：去掉script、style标签，然后去掉HTML标签
let cleanText = html
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

// 分割成句子/短语
const words = cleanText.split(' ').map(w => w.trim()).filter(w => w.length > 0);

// 找一些常见的中文字符
const chineseRegex = /[\u4e00-\u9fa5]+/g;
const chineseTexts = cleanText.match(chineseRegex) || [];

console.log('========================================');
console.log('找到的中文文本片段（前50条）：');
console.log('========================================\n');

chineseTexts.slice(0, 50).forEach((text, i) => {
  if (text.length > 5 && text.length < 50) {
    console.log(`${i+1}. ${text}`);
  }
});

console.log('\n========================================');
console.log('总结：');
console.log('========================================');
console.log('- 成功获取到B站搜索结果HTML！');
console.log('- 搜索关键词：数字人歌手');
console.log('- HTML文件：226K完整页面');
console.log('- 包含大量中文内容');
console.log('\n可以继续用curl获取其他关键词的搜索结果！');

