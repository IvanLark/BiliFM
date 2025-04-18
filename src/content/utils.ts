import { Song } from "../storage/storage.type";
import { getVideoInfo } from "../utils/bilibiliApi";

// 检测是否为B站视频页面
export const isBilibiliVideoPage = (): boolean => {
  return /^https?:\/\/(www\.|m\.)?bilibili\.com\/video\/BV/.test(
    window.location.href
  );
};

interface PlayInfo {data:{dash:{audio:{baseUrl: string}[]}}};

// 获取PlayInfo信息
export const getPlayInfo = (): PlayInfo | null => {
  const scripts = document.querySelectorAll("script");
  for (const script of scripts) {
    if (script.innerText.includes("window.__playinfo__")) {
      return JSON.parse(script.innerText.replace("window.__playinfo__=", ""));
    }
  }
  return null;
};

// 获取当前b站视频信息
export const getSong = async (): Promise<Song> => {
  let playinfo = null;
  let tryCount = 0;
  const maxTries = 20;
  
  while (!playinfo) {
    playinfo = getPlayInfo();
    if (!playinfo) {
      tryCount++;
      if (tryCount >= maxTries) {
        console.error("获取播放信息失败，已超过最大尝试次数");
        throw new Error("获取播放信息失败，已超过最大尝试次数");
      }
      // 等待350ms
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  // 音频URL
  //const audioUrl = playinfo.data.dash.audio[0].baseUrl;
  
  // 视频分p
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get("p") || "1");
  
  // BV号
  const bvidRegex = /bilibili\.com\/video\/(BV[0-9a-zA-Z]{10})/;
  const bvidMatch = window.location.href.match(bvidRegex);
  const bvid = bvidMatch ? bvidMatch[1] : null;

  if (!bvid) {
    throw new Error("无法获取BV号");
  }

  const videoInfo = await getVideoInfo(bvid, page);
  
  return {
    ...videoInfo,
    page
  };
};


