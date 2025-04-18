import React from 'react';
import { createRoot } from 'react-dom/client';
import './content.css';
import CollectCard from './components/CollectCard';
import { isBilibiliVideoPage } from './utils';

console.log("内容脚本加载成功");

// 插入收藏卡片
const insertCollectCard = () => {
  const parentElement = document.querySelector("div.up-panel-container");
  if (parentElement) {
    console.log("目标父元素定位成功");

    // 创建React根元素
    const root = document.createElement("div");
    root.id = "crx-root";
    parentElement.appendChild(root);

    // 渲染React组件
    createRoot(root).render(
      <React.StrictMode>
        <CollectCard />
      </React.StrictMode>
    );
  } else {
    console.error("目标父元素未找到，无法插入收藏卡片");
  }
};

const isReady = (): boolean => {
  const header = document.getElementById("biliMainHeader");
  if (!header) return false;
  const fixedHeader = header.querySelector("div.bili-header.fixed-header");
  if (!fixedHeader) return false;
  return true;
}

// 主逻辑流程，前30秒每隔1秒检查一下是否存在收藏卡片，不存在则插入
const runCollectCardFlow = () => {
  if (isBilibiliVideoPage()) {
    console.log("当前页面为B站视频页面，准备插入收藏卡片");
    
    try {
      // 多次检查，确保DOM已加载完成
      let checkCount = 0;
      const maxChecks = 30; // 最多检查30次
      
      const checkAndInsert = () => {
        if (checkCount < maxChecks) {
          if (isReady() && !document.getElementById("crx-root")) insertCollectCard();
          checkCount++;
          setTimeout(checkAndInsert, 1000);
        }
      };
      
      checkAndInsert();
    } catch (error) {
      console.error("处理收藏卡片流程时出错:", error);
    }
  }
};

// 监听页面跳转，如果页面跳转则重新渲染
let lastUrl = location.href;
const urlChangeDetector = setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log("页面发生跳转，重新执行主逻辑");
    
    // 先删除之前创建的React根元素
    const oldRoot = document.getElementById("crx-root");
    if (oldRoot) {
      oldRoot.remove();
    }
    
    // 重新执行主逻辑
    setTimeout(runCollectCardFlow, 4500);
  }
}, 500);

// 首次执行
setTimeout(runCollectCardFlow, 2000);

// 清理
window.addEventListener('beforeunload', () => {
  clearInterval(urlChangeDetector);
});
