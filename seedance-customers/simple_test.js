
const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('简单测试');
console.log('========================================\n');

// API key
const API_KEY = '588ed45b-cc6e-46b9-acf2-e38bce75986c';
console.log('API Key:', API_KEY);
console.log('\n');

// 列出所有PNG文件
console.log('PNG文件列表:');
const files = fs.readdirSync(__dirname);
const pngFiles = files.filter(f =&gt; f.endsWith('.png'));
pngFiles.forEach(f =&gt; console.log('  -', f));

console.log('\n');
console.log('========================================');
console.log('下一步：');
console.log('1. 直接重新生成小红书登录二维码');
console.log('2. 手动检查二维码是否正确');
console.log('3. 发送给用户扫码');
console.log('========================================');

// 保存测试信息
const info = {
  apiKey: API_KEY,
  pngFiles: pngFiles,
  timestamp: new Date().toISOString()
};

fs.writeFileSync(path.join(__dirname, 'simple_test.json'), JSON.stringify(info, null, 2));

