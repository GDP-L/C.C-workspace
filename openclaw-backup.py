#!/usr/bin/env python3
"""
OpenClaw 备份脚本
备份整个 ~/.openclaw/ 目录到 /root/backups/openclaw/
"""

import os
import sys
import tarfile
import datetime
import shutil

# 配置
SOURCE_DIR = os.path.expanduser("~/.openclaw/")
BACKUP_DIR = "/root/backups/openclaw/"
MAX_BACKUPS = 3


def log(message, level="INFO"):
    """打印日志消息"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


def create_backup_dir():
    """创建备份目录（如果不存在）"""
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR, exist_ok=True)
        log(f"创建备份目录: {BACKUP_DIR}")


def get_backup_filename():
    """生成备份文件名"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"openclaw-backup-{timestamp}.tar.gz"


def create_backup():
    """创建备份"""
    backup_filename = get_backup_filename()
    backup_path = os.path.join(BACKUP_DIR, backup_filename)
    
    log(f"开始备份: {SOURCE_DIR} -> {backup_path}")
    
    try:
        with tarfile.open(backup_path, "w:gz") as tar:
            tar.add(SOURCE_DIR, arcname=os.path.basename(SOURCE_DIR))
        log(f"备份完成: {backup_path}")
        return backup_path
    except Exception as e:
        log(f"备份失败: {e}", "ERROR")
        return None


def cleanup_old_backups():
    """清理旧备份，只保留最新的 MAX_BACKUPS 个"""
    log(f"检查备份数量，保留最新的 {MAX_BACKUPS} 个")
    
    # 获取所有备份文件
    backups = []
    for filename in os.listdir(BACKUP_DIR):
        if filename.startswith("openclaw-backup-") and filename.endswith(".tar.gz"):
            filepath = os.path.join(BACKUP_DIR, filename)
            backups.append((os.path.getmtime(filepath), filepath))
    
    # 按修改时间排序（最新的在前）
    backups.sort(reverse=True, key=lambda x: x[0])
    
    # 删除超过 MAX_BACKUPS 的旧备份
    if len(backups) > MAX_BACKUPS:
        for _, filepath in backups[MAX_BACKUPS:]:
            try:
                os.remove(filepath)
                log(f"删除旧备份: {filepath}")
            except Exception as e:
                log(f"删除旧备份失败 {filepath}: {e}", "ERROR")
    else:
        log(f"当前备份数量: {len(backups)}，无需清理")


def main():
    """主函数"""
    log("=== OpenClaw 备份脚本启动 ===")
    
    # 检查源目录是否存在
    if not os.path.exists(SOURCE_DIR):
        log(f"源目录不存在: {SOURCE_DIR}", "ERROR")
        return 1
    
    # 创建备份目录
    create_backup_dir()
    
    # 创建备份
    backup_path = create_backup()
    if not backup_path:
        return 1
    
    # 清理旧备份
    cleanup_old_backups()
    
    log("=== 备份完成 ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
