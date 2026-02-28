
#!/bin/bash

# 代理配置
PROXY="http://202602271335241351:rbsqmwrq@a963.zdtps.com:21166"

# Cookie文件路径
COOKIE_FILE="/root/.openclaw/workspace/seedance-customers/xiaohongshu_cookies.json"

# 输出文件
OUTPUT_FILE="/root/.openclaw/workspace/seedance-customers/xiaohongshu_curl_result.html"

echo "正在用curl结合代理访问小红书..."
echo "代理: $PROXY"
echo ""

# 提取Cookie（简单提取，把JSON里的name和value拼起来）
COOKIE_STRING=""
while IFS= read -r line; do
  if echo "$line" | grep -q '"name":' && echo "$line" | grep -q '"value":'; then
    name=$(echo "$line" | grep -o '"name": *"[^"]*"' | cut -d'"' -f4)
    value=$(echo "$line" | grep -o '"value": *"[^"]*"' | cut -d'"' -f4)
    if [ -n "$name" ] && [ -n "$value" ]; then
      COOKIE_STRING="${COOKIE_STRING}${name}=${value};"
    fi
  fi
done < "$COOKIE_FILE"

echo "使用Cookie: ${#COOKIE_STRING} 字符"
echo ""

# 用curl访问
curl -x "$PROXY" \
  -L "https://www.xiaohongshu.com/" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36" \
  -H "Accept-Language: zh-CN,zh;q=0.9" \
  --cookie "$COOKIE_STRING" \
  --connect-timeout 30 \
  --max-time 60 \
  -o "$OUTPUT_FILE" \
  -v

echo ""
echo "========================================"
if [ $? -eq 0 ]; then
  echo "✅ curl访问成功！"
  echo "结果已保存到: $OUTPUT_FILE"
  echo "文件大小: $(du -h "$OUTPUT_FILE")"
else
  echo "❌ curl访问失败"
fi
echo "========================================"

