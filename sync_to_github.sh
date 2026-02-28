#!/bin/bash
# C.C工作区自动同步到GitHub脚本

WORKSPACE_DIR="/root/.openclaw/workspace"
cd "$WORKSPACE_DIR"

echo "🔄 [C.C] 开始同步检查... $(date)"

# 检查git状态
if git status | grep -q "Changes to be committed\|Changes not staged\|Untracked files"; then
    echo "📝 [C.C] 发现变更，准备提交..."
    
    # 添加所有变更
    git add .
    
    # 提交
    COMMIT_MSG="自动同步: $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    
    # 推送
    echo "🚀 [C.C] 推送到GitHub..."
    git push origin main
    
    echo "✅ [C.C] 同步完成！"
else
    echo "ℹ️ [C.C] 没有变更，无需同步"
fi

echo "🔚 [C.C] 同步检查结束 $(date)"
