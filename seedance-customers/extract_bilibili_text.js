
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// 工作目录
const WORK_DIR = '/root/.openclaw/workspace/seedance-customers';
const HTML_PATH = path.join(WORK_DIR, 'bilibili_search_digital_singer.html');

console.log('正在读取HTML文件...');
const html = fs.readFileSync(HTML_PATH, 'utf-8');
console.log(`✅ HTML文件大小: ${(html.length / 1024).toFixed(2)} KB\n`);

// 用cheerio解析HTML
const $ = cheerio.load(html);

console.log('========================================');
console.log('页面标题:', $('title').text());
console.log('========================================\n');

// 提取所有文本内容
const allText = $('body').text();
const lines = allText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

console.log('找到的可见文本（前50条）：');
console.log('='.repeat(80));
lines.slice(0, 50).forEach((text, i) => {
  if (text.length > 10 && text.length < 200) {
    console.log(`${i+1}. ${text}`);
  }
});
console.log('='.repeat(80));
console.log(`\n总共找到 ${lines.length} 行文本`);

// 尝试查找包含关键词的文本
const keywords = ['UP主', '歌手', '数字人', '虚拟', '视频', '投稿'];
console.log('\n========================================');
console.log('包含关键词的文本：');
console.log('========================================\n');

let foundCount = 0;
for (let line of lines) {
  for (let keyword of keywords) {
    if (line.includes(keyword) && line.length > 10 && line.length < 200) {
      console.log(`${foundCount+1}. ${line}`);
      foundCount++;
      if (foundCount >= 30) break;
      break;
    }
  }
  if (foundCount >= 30) break;
}

console.log('\n✅ 提取完成！');

