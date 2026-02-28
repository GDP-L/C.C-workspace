
const fs = require('fs');
const path = require('path');

const HTML_PATH = path.join(__dirname, 'xiaohongshu_search_ai.html');

console.log('正在读取HTML文件...');
const html = fs.readFileSync(HTML_PATH, 'utf-8');

console.log('HTML文件大小:', (html.length / 1024, 'KB');

// 简单提取一些包含关键词的文本片段
const keywords = ['AI', '视频', '生成', '制作', '电商'];
const lines = html.split('\n');
const relevantTexts = [];

for (let line of lines) {
  for (let keyword of keywords) {
    if (line.includes(keyword) && line.length > 10 && line.length < 500) {
      // 简单清理一下文本
      let cleanText = line.replace(/<[^>]+>/g, '').trim();
      if (cleanText.length > 5) {
        relevantTexts.push(cleanText);
        break;
      }
    }
  }
}

console.log('\n找到的相关文本片段（前30条）：');
console.log('='.repeat(80));
relevantTexts.slice(0, 30).forEach((text, i) => {
  console.log(`${i+1}. ${text.substring(0, 200)}...`);
});
console.log('='.repeat(80));
console.log(`\n总共找到 ${relevantTexts.length} 条相关文本片段');

