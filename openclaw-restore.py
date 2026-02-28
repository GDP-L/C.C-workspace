#!/usr/bin/env python3
"""
OpenClaw 恢复脚本
从 /root/backups/openclaw/ 恢复备份
"""

import os
import sys
import tarfile
import datetime
import shutil

# 配置
SOURCE_DIR = os.path.expanduser("~/.openclaw/")
BACKUP_DIR = "/root/backups/openclaw/"


def log(message, level="INFO"):
    """打印日志消息"""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


def list_backups():
    """列出所有可用的备份"""
    log("列出可用备份:")
    
    backups = []
    if os.path.exists(BACKUP_DIR):
        for filename in os.listdir(BACKUP_DIR):
            if filename.startswith("openclaw-backup-") and filename.endswith(".tar.gz"):
                filepath = os.path.join(BACKUP_DIR, filename)
                mtime = datetime.datetime.fromtimestamp(os.path.getmtime(filepath))
                size = os.path.getsize(filepath)
                backups.append((mtime, filename, filepath, size))
    
    # 按时间排序（最新的在前）
    backups.sort(reverse=True, key=lambda x: x[0])
    
    if not backups:
        print("  没有找到备份文件")
        return []
    
    for i, (mtime, filename, filepath, size) in enumerate(backups, 1):
        size_mb = size / (1024 * 1024)
        print(f"  {i}. {filename} ({mtime.strftime('%Y-%m-%d %H:%M:%S')}, {size_mb:.2f} MB)")
    
    return backups


def get_pre_restore_filename():
    """生成恢复前备份文件名"""
    timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"pre-restore-{timestamp}.tar.gz"


def create_pre_restore_backup():
    """创建恢复前备份"""
    if not os.path.exists(SOURCE_DIR):
        log("当前 OpenClaw 目录不存在，跳过恢复前备份")
        return None
    
    backup_filename = get_pre_restore_filename()
    backup_path = os.path.join(BACKUP_DIR, backup_filename)
    
    log(f"创建恢复前备份: {SOURCE_DIR} -> {backup_path}")
    
    try:
        with tarfile.open(backup_path, "w:gz") as tar:
            tar.add(SOURCE_DIR, arcname=os.path.basename(SOURCE_DIR))
        log(f"恢复前备份完成: {backup_path}")
        return backup_path
    except Exception as e:
        log(f"恢复前备份失败: {e}", "ERROR")
        return None


def restore_backup(backup_path):
    """恢复备份"""
    log(f"开始恢复: {backup_path} -> {SOURCE_DIR}")
    
    # 先备份当前状态
    pre_restore_backup = create_pre_restore_backup()
    if not pre_restore_backup:
        log("警告: 恢复前备份失败，但继续执行恢复", "WARNING")
    
    # 要求用户确认
    print("\n" + "=" * 60)
    print("⚠️  警告：此操作将覆盖当前的 OpenClaw 配置！")
    print("=" * 60)
    confirm = input("确认继续恢复？(yes/no): ").strip().lower()
    
    if confirm != "yes":
        log("恢复已取消")
        return False
    
    # 删除当前目录
    if os.path.exists(SOURCE_DIR):
        try:
            shutil.rmtree(SOURCE_DIR)
            log(f"已删除当前目录: {SOURCE_DIR}")
        except Exception as e:
            log(f"删除当前目录失败: {e}", "ERROR")
            return False
    
    # 解压备份
    try:
        with tarfile.open(backup_path, "r:gz") as tar:
            tar.extractall(path=os.path.dirname(SOURCE_DIR))
        log(f"恢复完成: {backup_path}")
        return True
    except Exception as e:
        log(f"恢复失败: {e}", "ERROR")
        return False


def verify_restore():
    """验证恢复是否成功"""
    log("验证恢复...")
    
    # 检查关键文件和目录
    critical_items = [
        "openclaw.json",
        "agents/",
        "extensions/",
        "workspace/",
    ]
    
    all_ok = True
    for item in critical_items:
        item_path = os.path.join(SOURCE_DIR, item)
        if os.path.exists(item_path):
            log(f"  ✓ {item} 存在")
        else:
            log(f"  ✗ {item} 不存在", "WARNING")
            all_ok = False
    
    if all_ok:
        log("恢复验证通过！")
    else:
        log("恢复验证完成，但有一些警告", "WARNING")
    
    return all_ok


def main():
    """主函数"""
    log("=== OpenClaw 恢复脚本启动 ===")
    
    # 检查备份目录
    if not os.path.exists(BACKUP_DIR):
        log(f"备份目录不存在: {BACKUP_DIR}", "ERROR")
        return 1
    
    # 解析命令行参数
    if len(sys.argv) == 1:
        # 没有参数，列出备份
        list_backups()
        print("\n使用方法:")
        print("  列出备份: python openclaw-restore.py")
        print("  恢复备份: python openclaw-restore.py <备份文件名>")
        return 0
    
    # 恢复指定备份
    backup_name = sys.argv[1]
    backup_path = os.path.join(BACKUP_DIR, backup_name)
    
    if not os.path.exists(backup_path):
        # 尝试只给文件名的一部分
        found = False
        for filename in os.listdir(BACKUP_DIR):
            if backup_name in filename and filename.startswith("openclaw-backup-"):
                backup_path = os.path.join(BACKUP_DIR, filename)
                found = True
                break
        
        if not found:
            log(f"备份文件不存在: {backup_name}", "ERROR")
            list_backups()
            return 1
    
    # 执行恢复
    success = restore_backup(backup_path)
    if not success:
        return 1
    
    # 验证恢复
    verify_restore()
    
    log("=== 恢复完成 ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
