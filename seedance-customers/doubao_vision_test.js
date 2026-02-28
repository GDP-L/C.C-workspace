
const fs = require('fs');
const path = require('path');
const https = require('https');

// API key
const API_KEY = '588ed45b-cc6e-46b9-acf2-e38bce75986c';

console.log('========================================');
console.log('火山引擎豆包 - 图片识别测试');
console.log('========================================\n');

// 第一张截图
const imagePath = path.join(__dirname, 'xiaohongshu_final_research_home.png');

if (!fs.existsSync(imagePath)) {
  console.log('❌ 图片不存在:', imagePath);
  console.log('可用的图片文件:');
  const files = fs.readdirSync(__dirname).filter(f =&gt; f.endsWith('.png'));
  files.forEach(f =&gt; console.log('  -', f));
  process.exit(1);
}

console.log('✅ 找到图片:', imagePath);

// 将图片转换为base64
function imageToBase64(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath);
  return imageBuffer.toString('base64');
}

console.log('\n正在将图片转换为base64...');
const base64Image = imageToBase64(imagePath);
console.log('✅ 图片转换完成，大小:', base64Image.length, '字符\n');

// 构建API请求
const requestData = {
  model: 'doubao-seed-2.0-code',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: '请详细描述这张图片的内容，特别注意：这是小红书的页面吗？有没有显示用户头像或用户名表示已登录？页面上有什么内容？'
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${base64Image}`
          }
        }
      ]
    }
  ],
  max_tokens: 1000
};

console.log('正在构建API请求...');
console.log('请求数据:', JSON.stringify(requestData, null, 2).substring(0, 500), '...\n');

// 发送API请求
function sendAPIRequest() {
  return new Promise((resolve, reject) =&gt; {
    const postData = JSON.stringify(requestData);
    
    const options = {
      hostname: 'ark.cn-beijing.volces.com',
      port: 443,
      path: '/api/v3/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('正在发送API请求到火山引擎豆包...\n');

    const req = https.request(options, (res) =&gt; {
      let data = '';

      res.on('data', (chunk) =&gt; {
        data += chunk;
      });

      res.on('end', () =&gt; {
        console.log('✅ API响应收到！');
        console.log('状态码:', res.statusCode);
        console.log('响应数据:', data.substring(0, 1000), '...\n');
        
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (error) =&gt; {
      console.error('❌ API请求失败:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// 执行测试
async function main() {
  try {
    console.log('开始测试火山引擎豆包图片识别API...\n');
    const result = await sendAPIRequest();
    
    console.log('========================================');
    console.log('API响应结果:');
    console.log('========================================');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.choices &amp;&amp; result.choices[0] &amp;&amp; result.choices[0].message) {
      console.log('\n========================================');
      console.log('图片理解结果:');
      console.log('========================================');
      console.log(result.choices[0].message.content);
    }
    
    // 保存结果
    const resultPath = path.join(__dirname, 'doubao_vision_result.json');
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`\n结果已保存到: ${resultPath}`);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

main();

