
const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('========================================');
console.log('火山API - 简化测试');
console.log('========================================\n');

const imagePath = path.join(__dirname, 'xiaohongshu_agent_captcha.png');

if (!fs.existsSync(imagePath)) {
  console.log('❌ 图片不存在:', imagePath);
  process.exit(1);
}

console.log('✅ 找到图片:', imagePath);

const imageBuffer = fs.readFileSync(imagePath);
const base64Image = imageBuffer.toString('base64');
console.log('✅ 图片转base64完成');

const API_KEY = '588ed45b-cc6e-46b9-acf2-e38bce75986c';

const requestData = {
  model: 'doubao-seed-2.0-code',
  messages: [
    {
      role: 'user',
      content: '请描述这张图片里有什么内容'
    }
  ]
};

console.log('\n正在构建请求...');

const postData = JSON.stringify(requestData);

const options = {
  hostname: 'ark.cn-beijing.volces.com',
  port: 443,
  path: '/api/v3/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + API_KEY,
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('正在发送API请求...\n');

const req = https.request(options, (res) =&gt; {
  let data = '';

  res.on('data', (chunk) =&gt; {
    data += chunk;
  });

  res.on('end', () =&gt; {
    console.log('✅ API响应收到！');
    console.log('状态码:', res.statusCode);
    console.log('响应:', data.substring(0, 500));
  });
});

req.on('error', (error) =&gt; {
  console.error('❌ 请求失败:', error);
});

req.write(postData);
req.end();

