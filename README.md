# OpenClaw 备份和恢复工具

这是一套用于备份和恢复 OpenClaw 配置的工具脚本。

## 文件说明

- `openclaw-backup.py` - 备份脚本
- `openclaw-restore.py` - 恢复脚本

## 备份功能

### 备份范围
- 整个 `~/.openclaw/` 目录

### 备份位置
- `/root/backups/openclaw/`（目录会自动创建）

### 命名规则
- 格式：`openclaw-backup-YYYYMMDD-HHMMSS.tar.gz`

### 保留策略
- 只保留最新的 3 个备份版本
- 超过 3 个后自动删除最早的版本

### 使用方法
```bash
python3 /root/.openclaw/workspace/openclaw-backup.py
```

## 恢复功能

### 恢复选项
1. 列出所有可用的备份版本
2. 选择恢复到某个特定备份版本

### 安全措施
- 恢复前自动备份当前状态到 `/root/backups/openclaw/pre-restore-YYYYMMDD-HHMMSS.tar.gz`
- 要求用户确认后再执行恢复

### 恢复验证
- 恢复后自动验证关键文件是否存在

### 使用方法

#### 1. 列出可用备份
```bash
python3 /root/.openclaw/workspace/openclaw-restore.py
```

#### 2. 恢复指定备份
```bash
python3 /root/.openclaw/workspace/openclaw-restore.py openclaw-backup-20260226-120000.tar.gz
```

或者只输入部分文件名：
```bash
python3 /root/.openclaw/workspace/openclaw-restore.py 20260226-120000
```

## 技术特点

- 使用 Python 编写，跨平台兼容性好
- 完善的错误处理和日志输出
- 备份时不需要停止 OpenClaw 服务
- 自动目录创建和清理

## 注意事项

1. 恢复操作会覆盖当前的 OpenClaw 配置，请谨慎操作
2. 恢复前会自动备份当前状态，以便回滚
3. 建议定期执行备份，确保数据安全
