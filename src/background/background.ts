import { Song, Playlist } from '../storage/storage.type';
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
  removeSongFromPlaylist,
  importData
} from '../storage/storage.util';
import { getVideoInfo } from '../utils/bilibiliApi';

// 后台主脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log("B站音乐播放器插件已安装");
});

// 初始化 IndexedDB 数据库
initDatabase();

// 获取所有B站cookie
// chrome.cookies.getAll({ url: `https://www.bilibili.com` }, (cookies) => {
//   if (chrome.runtime.lastError) {
//     console.error("获取 Cookie 时出错:", chrome.runtime.lastError);
//     return;
//   }
//   console.log("bilibili cookies:", cookies);
// });

// 点击插件图标打开播放器
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("index.html"),
  });
});

const onSongUpdate = () => {
  chrome.runtime.sendMessage({
    action: "song_update",
  });
}

const onPlaylistUpdate = () => {
  chrome.runtime.sendMessage({
    action: "playlist_update",
  });
}

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((
  message: { action: string; data?: unknown; playlistId?: number; songId?: number }, 
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void
) => {
  // 初始化窗口
  if (message.action === "collect_card_init") {
    console.log("收到初始化窗口请求:", sender.tab?.id);
    if (message.data) {
      const song = message.data as Song;
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
    const song = message.data as Song;
    addSong(song, ({ success, id }) => {
      if (success) {
        onSongUpdate();
      }
      sendResponse({ success, id });
    });
    return true; // 表示异步响应
  }
  // 添加歌曲到歌单
  if (message.action === "add_song_to_playlist") {
    console.log("收到添加歌曲到歌单请求:", message.playlistId, message.songId);
    addSongToPlaylist(message.playlistId as number, message.songId as number, ({ success }) => {
      if (success) {
        onPlaylistUpdate();
      }
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
    const playlist = message.data as Playlist;
    addPlaylist(playlist, ({ success, id }) => {
      sendResponse({ success, id });
    });
    return true; // 异步响应
  }
  // 删除歌曲
  if (message.action === "delete_song") {
    deleteSongById(message.songId as number, ({ success }) => {
      sendResponse({ success });
    });
    return true;
  }
  // 删除歌单
  if (message.action === "delete_playlist") {
    deletePlaylistById(message.playlistId as number, ({ success }) => {
      sendResponse({ success });
    });
    return true;
  }
  // 从歌单移除歌曲
  if (message.action === "remove_song_from_playlist") {
    removeSongFromPlaylist(
      message.playlistId as number,
      message.songId as number,
      ({ success }) => {
        sendResponse({ success });
      }
    );
    return true;
  }
  // 导入数据
  if (message.action === "import_data") {
    const data = message.data as { songs: Song[]; playlists: Playlist[] };
    importData(data, ({ success }) => {
      sendResponse({ success });
    });
    return true;
  }
  return false;
});

const menu_id = {
  collect_song: 'collect_song',
};

// 右键菜单
chrome.contextMenus.create({
  id: menu_id.collect_song,
  title: '收藏歌曲',
  contexts: ['link'],
  targetUrlPatterns: ['https://*.bilibili.com/video/BV*'],
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === menu_id.collect_song) {
    console.log("收到收藏歌曲请求:", info.linkUrl);
    const url = info.linkUrl;
    if (!url) return;
    // BV号
    const bvidRegex = /bilibili\.com\/video\/(BV[0-9a-zA-Z]{10})/;
    const bvidMatch = url.match(bvidRegex);
    const bvid = bvidMatch ? bvidMatch[1] : null;
    if (!bvid) return;
    // 从url中提取p参数，如果没有则默认为1
    let page = 1;
    const pMatch = url.match(/[?&]p=(\d+)/);
    if (pMatch && pMatch[1]) {
      page = parseInt(pMatch[1], 10);
    }

    // 查看是否已经收藏
    checkSongExists(bvid, page, ({ isExist }) => {
      if (isExist) return;
      getVideoInfo(bvid, page).then((videoInfo) => {
        console.log("收到收藏歌曲请求:", videoInfo);
        const song: Song = {
          ...videoInfo,
          page,
        }
        addSong(song, ({ success }) => {
          if (success) {
            //alert("歌曲已收藏！");
            onSongUpdate();
          } else {
            //alert("收藏失败！");
          }
        });
      });
    });
  }
});

console.log("background script running");