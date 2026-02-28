
const fs = require('fs');
const path = require('path');

// 简单的图片转base64测试
console.log('========================================');
console.log('简单图片转base64测试');
console.log('========================================\n');

const imagePath = path.join(__dirname, 'xiaohongshu_agent_captcha.png');

if (!fs.existsSync(imagePath)) {
  console.log('❌ 图片不存在:', imagePath);
  process.exit(1);
}

console.log('✅ 找到图片:', imagePath);

// 将图片转换为base64
console.log('\n正在将图片转换为base64...');
const imageBuffer = fs.readFileSync(imagePath);
const base64Image = imageBuffer.toString('base64');
console.log('✅ 图片转换完成，大小:', base64Image.length, '字符');

// 保存base64到文件（前1000字符）
const outputPath = path.join(__dirname, 'base64_preview.txt');
fs.writeFileSync(outputPath, base64Image.substring(0, 1000) + '\n...\n(截断，完整长度: ' + base64Image.length + ')', 'utf-8');
console.log('✅ Base64预览已保存到:', outputPath);

console.log('\n========================================');
console.log('测试完成！');
console.log('========================================');

