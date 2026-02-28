
const fs = require('fs');
const path = require('path');

// API key
const API_KEY = '588ed45b-cc6e-46b9-acf2-e38bce75986c';

console.log('========================================');
console.log('火山引擎豆包 API 测试');
console.log('========================================\n');
console.log('API Key:', API_KEY);
console.log('\n正在查找火山引擎豆包的API文档...\n');

// 先尝试理解这个API的使用方式
console.log('火山引擎豆包通常的API端点：');
console.log('- 图片理解/视觉问答: https://ark.cn-beijing.volces.com/api/v3/chat/completions');
console.log('- 或者使用多模态模型\n');

console.log('让我先保存一个测试说明...');

const testInfo = {
  apiKey: API_KEY,
  timestamp: new Date().toISOString(),
  note: '需要学习火山引擎豆包图片识别API的使用方法',
  nextSteps: [
    '1. 查找火山引擎豆包多模态API文档',
    '2. 学习如何调用图片理解API',
    '3. 测试API能否正确识别图片内容',
    '4. 重新生成小红书登录二维码',
    '5. 使用API检查二维码是否正确',
    '6. 发送给用户扫码'
  ]
};

const infoPath = path.join(__dirname, 'doubao_api_test.json');
fs.writeFileSync(infoPath, JSON.stringify(testInfo, null, 2), 'utf-8');
console.log(`测试信息已保存到: ${infoPath}`);

console.log('\n========================================');
console.log('接下来我会：');
console.log('1. 先学习如何使用这个API');
console.log('2. 然后重新生成小红书登录二维码');
console.log('3. 使用API检查内容是否正确');
console.log('4. 发送给你扫码');
console.log('========================================');

