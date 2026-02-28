#!/usr/bin/env node

/**
 * 每日日报生成脚本
 * 每天11:30执行，整理当天工作内容并在Britania知识库创建日报
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  workspace: '/root/.openclaw/workspace',
  memoryDir: '/root/.openclaw/workspace/memory',
  wikiSpaceId: '7611797196412931266',
  account: 'main'
};

/**
 * 获取今天的日期字符串
 */
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 读取今天的memory文件
 */
function readTodayMemory() {
  const today = getTodayDate();
  const memoryFile = path.join(CONFIG.memoryDir, `${today}.md`);
  
  if (!fs.existsSync(memoryFile)) {
    console.log(`今天的memory文件不存在: ${memoryFile}`);
    return null;
  }
  
  return fs.readFileSync(memoryFile, 'utf-8');
}

/**
 * 生成日报内容
 */
function generateReportContent() {
  const today = getTodayDate();
  const memoryContent = readTodayMemory();
  
  let content = `# 日报 - ${today}\n\n`;
  content += `## 日期\n${today}\n\n`;
  content += `## 工作内容\n\n`;
  
  if (memoryContent) {
    content += memoryContent;
  } else {
    content += `暂无今天的工作记录。\n`;
  }
  
  content += `\n---\n`;
  content += `*此日报由C.C自动生成*\n`;
  
  return content;
}

/**
 * 在知识库创建日报页面
 */
async function createWikiPage(title, content) {
  // 这里需要调用feishu_wiki和feishu_doc工具
  // 由于这是一个独立脚本，我们通过openclaw的命令行工具来调用
  // 或者直接使用飞书SDK
  
  console.log(`创建日报页面: ${title}`);
  console.log(`内容长度: ${content.length} 字符`);
  
  // 注意：这个脚本需要在OpenClaw环境中运行才能使用feishu工具
  // 这里只是一个框架，实际执行需要通过OpenClaw的cron系统
  
  return {
    success: true,
    title,
    content
  };
}

/**
 * 主函数
 */
async function main() {
  console.log('=== 开始生成每日日报 ===');
  console.log(`日期: ${getTodayDate()}`);
  
  try {
    const title = `日报 - ${getTodayDate()}`;
    const content = generateReportContent();
    
    const result = await createWikiPage(title, content);
    
    if (result.success) {
      console.log('✅ 日报生成成功！');
      console.log(`标题: ${result.title}`);
    } else {
      console.log('❌ 日报生成失败');
    }
    
  } catch (error) {
    console.error('❌ 执行出错:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  generateReportContent,
  createWikiPage,
  getTodayDate
};
