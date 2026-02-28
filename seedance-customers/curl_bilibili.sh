
#!/bin/bash

# 工作目录
WORK_DIR="/root/.openclaw/workspace/seedance-customers"

cd "$WORK_DIR"

echo "============================================"
echo "测试B站搜索（不用代理）"
echo "============================================"
echo

# 搜索关键词
KEYWORD="数字人歌手"
SEARCH_URL="https://search.bilibili.com/all?keyword=$(echo "$KEYWORD" | sed 's/ /%20/g')"

echo "正在访问: $SEARCH_URL"
echo

curl -L "$SEARCH_URL" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36" \
  -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8" \
  -H "Accept-Language: zh-CN,zh;q=0.9" \
  -H "Connection: keep-alive" \
  -o bilibili_search_digital_singer.html \
  -v

echo
echo "============================================"
echo "完成！"
echo "文件保存到: bilibili_search_digital_singer.html"
echo "文件大小: $(ls -lh bilibili_search_digital_singer.html | awk '{print $5}')"
echo "============================================"

