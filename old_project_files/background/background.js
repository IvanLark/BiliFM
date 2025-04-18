// 后台主脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log("B站音乐播放器插件已安装");
});

// 引入 storage.js 中的存储函数
import {
  initDatabase,
  getAllPlaylists,
  addPlaylist,
  addSong,
  getAllSongs,
  addSongToPlaylist,
  deleteSongById,
  deletePlaylistById,
  checkSongExists,
  remove_song_from_playlist,
} from "../utils/storage.js";

// 初始化 IndexedDB 数据库
initDatabase();

// 获取所有B站cookie
chrome.cookies.getAll({ url: `https://www.bilibili.com` }, (cookies) => {
  if (chrome.runtime.lastError) {
    console.error("获取 Cookie 时出错:", chrome.runtime.lastError);
    return;
  }
  console.log("bilibili cookies:", cookies);
});

// 点击插件图标打开播放器
chrome.action.onClicked.addListener((tab) => {
  console.log("onClicked");
  chrome.tabs.create({
    url: chrome.runtime.getURL("player/player.html"),
  });
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 初始化窗口
  if (message.action === "collect_card_init") {
    console.log("收到初始化窗口请求:", sender.tab.id);
    if (message.data) {
      const song = message.data;
      checkSongExists(song.bvid, song.page, ({ isExist, id }) => {
        // 获取歌单
        getAllPlaylists(({ playlists }) => {
          sendResponse({ isExist, playlists, id });
        });
      });
    }
    return true; // 表示异步响应
  }
  // 收藏音频
  if (message.action === "collect_song") {
    console.log("收到收藏音频请求:", message.data);
    addSong(message.data, ({ success, id }) => {
      sendResponse({ success, id });
    });
    return true; // 表示异步响应
  }
  // 添加歌曲到歌单
  if (message.action === "add_song_to_playlist") {
    console.log("收到添加歌曲到歌单请求:", message.playlistId, message.songId);
    addSongToPlaylist(message.playlistId, message.songId, ({ success }) => {
      sendResponse({ success });
    });
    return true; // 表示异步响应
  }
  // 获取所有歌曲
  if (message.action === "get_all_songs") {
    getAllSongs(({ success, songs }) => {
      sendResponse({ success, songs });
    });
    return true; // 异步响应
  }
  // 获取所有歌单
  if (message.action === "get_all_playlists") {
    getAllPlaylists(({ success, playlists }) => {
      sendResponse({ success, playlists });
    });
    return true; // 异步响应
  }
  // 添加歌单
  if (message.action === "add_playlist") {
    addPlaylist(message.playlist, ({ success, id }) => {
      sendResponse({ success, id });
    });
    return true; // 异步响应
  }
  // 删除歌曲
  if (message.action === "delete_song") {
    deleteSongById(message.songId, ({ success }) => {
      sendResponse({ success });
    });
    return true;
  }
  // 删除歌单
  if (message.action === "delete_playlist") {
    deletePlaylistById(message.playlistId, ({ success }) => {
      sendResponse({ success });
    });
    return true;
  }
  // 从歌单移除歌曲
  if (message.action === "remove_song_from_playlist") {
    remove_song_from_playlist(
      message.playlistId,
      message.songId,
      ({ success }) => {
        sendResponse({ success });
      }
    );
    return true;
  }
});
