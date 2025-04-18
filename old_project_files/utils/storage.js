// 存储相关工具函数

const dbName = "BilibiliMusicPlayerDB";
const dbVersion = 3;
const dbStoreNames = {
  PLAYLISTS: "playlists", // 歌单存储
  SONGS: "songs", // 歌曲存储
};

/**
 * 歌单数据结构
 * @typedef {Object} Playlist
 * @property {string} id - 歌单ID
 * @property {string} name - 歌单名称
 * @property {string} description - 歌单描述
 * @property {string} cover - 歌单封面（图片二进制数据）（如果用户没有上传则为null）
 * @property {Array} songs - 歌曲ID列表
 */

/**
 * 歌曲数据结构
 * @typedef {Object} Song
 * @property {string} id - 歌曲ID
 * @property {string} title - 歌曲标题
 * @property {Object} author - 歌曲作者信息
 * @property {string} author.name - 作者名称
 * @property {string} author.mid - 作者MID
 * @property {string} author.avatar - 作者头像URL
 * @property {string} cover - 歌曲封面URL
 * @property {string} audioUrl - 歌曲音频URL
 * @property {string} bvid - 歌曲B站视频ID
 * @property {string} cid - 视频CID
 * @property {string} aid - 视频AID
 * @property {number} page - 视频分p
 * @property {string} description - b站视频简介
 * @property {number} duration - 歌曲时长（以秒为单位）
 */

let dbInstance = null;

// 初始化 IndexedDB 数据库
export const initDatabase = () => {
  const request = indexedDB.open(dbName, dbVersion); // 打开或创建数据库

  // 数据库版本升级时触发
  request.onupgradeneeded = (event) => {
    const db = event.target.result; // 获取数据库实例
    // 创建歌单对象存储
    const playlistStore = db.createObjectStore(dbStoreNames.PLAYLISTS, {
      keyPath: "id", // 主键
      autoIncrement: true, // 自动递增
    });
    // 创建索引
    playlistStore.createIndex("name", "name", { unique: false });
    console.log("歌单对象存储创建成功");
    // 创建歌曲对象存储
    const songStore = db.createObjectStore(dbStoreNames.SONGS, {
      keyPath: "id", // 主键
      autoIncrement: true, // 自动递增
    });
    // 创建索引
    songStore.createIndex("bvid", "bvid", { unique: false });
    console.log("歌曲对象存储创建成功");
  };

  // 数据库打开成功时触发
  request.onsuccess = (event) => {
    dbInstance = event.target.result; // 存储数据库实例
    // 清空两个数据表中的数据
    /*const playlistStore = dbInstance
      .transaction(dbStoreNames.PLAYLISTS, "readwrite")
      .objectStore(dbStoreNames.PLAYLISTS);
    playlistStore.clear();
    const songStore = dbInstance
      .transaction(dbStoreNames.SONGS, "readwrite")
      .objectStore(dbStoreNames.SONGS);
    songStore.clear();*/
    console.log("IndexedDB 初始化成功"); // 输出成功日志
  };

  // 数据库打开失败时触发
  request.onerror = (event) => {
    console.error("IndexedDB 初始化失败", event.target.error); // 输出错误日志
  };
};

// 添加歌单到 IndexedDB
export const addPlaylist = (playlist, callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ id: null, success: false });
    return;
  }

  const transaction = dbInstance.transaction(
    dbStoreNames.PLAYLISTS,
    "readwrite"
  ); // 创建读写事务
  const store = transaction.objectStore(dbStoreNames.PLAYLISTS); // 获取 'playlists' 对象存储
  const addRequest = store.add(playlist); // 添加歌单到对象存储

  // 添加成功时触发
  addRequest.onsuccess = () => {
    console.log("歌单添加成功"); // 输出成功日志
    callback({ id: addRequest.result, success: true }); // 调用回调函数，传递成功状态
  };

  // 添加失败时触发
  addRequest.onerror = (event) => {
    console.error("歌单添加失败", event.target.error); // 输出错误日志
    callback({ id: null, success: false }); // 调用回调函数，传递失败状态
  };
};

// 获取所有歌单
export const getAllPlaylists = (callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false, playlists: [] });
    return;
  }

  const transaction = dbInstance.transaction(
    dbStoreNames.PLAYLISTS,
    "readonly"
  ); // 创建只读事务
  const store = transaction.objectStore(dbStoreNames.PLAYLISTS); // 获取 'playlists' 对象存储
  const playlists = []; // 用于存储所有歌单

  // 遍历对象存储中的所有记录
  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result; // 获取游标
    if (cursor) {
      playlists.push(cursor.value); // 将当前记录添加到数组
      cursor.continue(); // 移动到下一个记录
    } else {
      // 对 playlists 根据id从大到小进行排序
      playlists.sort((a, b) => b.id - a.id);
      callback({ success: true, playlists }); // 遍历完成后调用回调函数，传递歌单数组
    }
  };
};

// 删除歌单
export const deletePlaylistById = (id, callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false });
    return;
  }

  if (typeof id === "string") {
    id = Number(id);
  }

  const transaction = dbInstance.transaction(
    dbStoreNames.PLAYLISTS,
    "readwrite"
  );
  const store = transaction.objectStore(dbStoreNames.PLAYLISTS);
  const deleteRequest = store.delete(id); // 删除指定 ID 的歌单

  deleteRequest.onsuccess = () => {
    console.log("歌单删除成功");
    callback({ success: true });
  };

  deleteRequest.onerror = (event) => {
    console.error("歌单删除失败", event.target.error);
    callback({ success: false });
  };
};

// 添加新函数
export const addSong = (song, callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ id: null, success: false });
    return;
  }

  const transaction = dbInstance.transaction(dbStoreNames.SONGS, "readwrite");
  const store = transaction.objectStore(dbStoreNames.SONGS);
  const addRequest = store.add(song);
  addRequest.onsuccess = () => {
    console.log("歌曲添加成功");
    callback({ id: addRequest.result, success: true });
  };
  addRequest.onerror = (event) => {
    console.error("歌曲添加失败", event.target.error);
    callback({ id: null, success: false });
  };
};

// 获取所有歌曲
export const getAllSongs = (callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false, songs: [] });
    return;
  }

  const transaction = dbInstance.transaction(dbStoreNames.SONGS, "readonly");
  const store = transaction.objectStore(dbStoreNames.SONGS);
  const songs = [];

  store.openCursor().onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      songs.push(cursor.value);
      cursor.continue();
    } else {
      // 对 songs 根据id从大到小进行排序
      songs.sort((a, b) => b.id - a.id);
      callback({ success: true, songs });
    }
  };

  transaction.onerror = (event) => {
    console.error("获取歌曲失败", event.target.error);
    callback({ success: false, songs: [] });
  };
};

// 根据id获取歌单
export const getPlaylistById = (id, callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false, playlist: null });
    return;
  }

  if (typeof id === "string") {
    id = Number(id);
  }

  const transaction = dbInstance.transaction(
    dbStoreNames.PLAYLISTS,
    "readonly"
  );
  const store = transaction.objectStore(dbStoreNames.PLAYLISTS);
  const request = store.get(id);

  request.onsuccess = (event) => {
    const playlist = event.target.result;
    callback({ success: true, playlist }); // 返回歌单对象或 null
  };

  request.onerror = (event) => {
    console.error("获取歌单失败", event.target.error);
    callback({ success: false, playlist: null });
  };
};

// 添加歌曲到歌单
export const addSongToPlaylist = (playlistId, songId, callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false });
    return;
  }

  // 判断如果 playlistId 和 songId 是字符串，则转换为数字
  if (typeof playlistId === "string") {
    playlistId = Number(playlistId);
  }
  if (typeof songId === "string") {
    songId = Number(songId);
  }

  const transaction = dbInstance.transaction(
    dbStoreNames.PLAYLISTS,
    "readwrite"
  );
  const store = transaction.objectStore(dbStoreNames.PLAYLISTS);
  const getRequest = store.get(playlistId); // 获取指定歌单

  getRequest.onsuccess = (event) => {
    const playlist = event.target.result;
    if (playlist) {
      if (!playlist.songs) playlist.songs = []; // 如果 songs 数组不存在，初始化它
      if (!playlist.songs.includes(songId)) {
        playlist.songs.push(songId); // 添加歌曲 ID
        const updateRequest = store.put(playlist); // 更新歌单
        updateRequest.onsuccess = () => {
          console.log("歌曲添加到歌单成功");
          callback({ success: true });
        };
        updateRequest.onerror = (event) => {
          console.error("更新歌单失败", event.target.error);
          callback({ success: false });
        };
      } else {
        console.log("歌曲已存在于歌单中");
        callback({ success: true }); // 或者根据需求处理
      }
    } else {
      console.error("歌单不存在");
      callback({ success: false });
    }
  };

  getRequest.onerror = (event) => {
    console.error("获取歌单失败", event.target.error);
    callback({ success: false });
  };
};

// 删除歌曲
export const deleteSongById = (id, callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false });
    return;
  }

  if (typeof id === "string") {
    id = Number(id);
  }

  const transaction = dbInstance.transaction(
    [dbStoreNames.SONGS, dbStoreNames.PLAYLISTS],
    "readwrite"
  );
  const songStore = transaction.objectStore(dbStoreNames.SONGS);
  const playlistStore = transaction.objectStore(dbStoreNames.PLAYLISTS);
  const deleteRequest = songStore.delete(id);

  deleteRequest.onsuccess = () => {
    playlistStore.openCursor().onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const playlist = cursor.value;
        if (playlist.songs && playlist.songs.includes(id)) {
          const index = playlist.songs.indexOf(id);
          playlist.songs.splice(index, 1);
          cursor.update(playlist);
        }
        cursor.continue();
      } else {
        console.log("歌曲删除成功并从歌单中移除");
        callback({ success: true });
      }
    };
  };

  deleteRequest.onerror = (event) => {
    console.error("歌曲删除失败", event.target.error);
    callback({ success: false });
  };
};

// 检查歌曲是否存在
export const checkSongExists = (bvid, page, callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false });
    return;
  }

  const transaction = dbInstance.transaction(dbStoreNames.SONGS, "readonly");
  const store = transaction.objectStore(dbStoreNames.SONGS);
  const index = store.index("bvid");

  index.openCursor(IDBKeyRange.only(bvid)).onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      if (cursor.value.page === page) {
        callback({ success: true, isExist: true, id: cursor.value.id }); // 找到匹配的歌曲
        return;
      }
      cursor.continue(); // 继续检查下一个 bvid 相同的歌曲
    } else {
      callback({ success: true, isExist: false }); // 没有匹配的歌曲
    }
  };

  transaction.onerror = (event) => {
    console.error("检查歌曲失败", event.target.error);
    callback({ success: false });
  };
};

// 根据id获取歌曲
export const getSongById = (id, callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false, song: null });
    return;
  }

  if (typeof id === "string") {
    id = Number(id);
  }

  const transaction = dbInstance.transaction(dbStoreNames.SONGS, "readonly");
  const store = transaction.objectStore(dbStoreNames.SONGS);
  const request = store.get(id);

  request.onsuccess = (event) => {
    const song = event.target.result;
    callback({ success: true, song }); // 返回歌曲对象或 null
  };

  request.onerror = (event) => {
    console.error("获取歌曲失败", event.target.error);
    callback({ success: false, song: null });
  };
};

// 从歌单移除歌曲
export const remove_song_from_playlist = (playlistId, songId, callback) => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false });
    return;
  }
  if (typeof playlistId === "string") playlistId = Number(playlistId);
  if (typeof songId === "string") songId = Number(songId);
  const transaction = dbInstance.transaction(
    dbStoreNames.PLAYLISTS,
    "readwrite"
  );
  const store = transaction.objectStore(dbStoreNames.PLAYLISTS);
  const getRequest = store.get(playlistId);
  getRequest.onsuccess = (event) => {
    const playlist = event.target.result;
    if (playlist) {
      playlist.songs = (playlist.songs || []).filter(
        (id) => String(id) !== String(songId)
      );
      const updateRequest = store.put(playlist);
      updateRequest.onsuccess = () => {
        callback({ success: true });
      };
      updateRequest.onerror = (event) => {
        callback({ success: false });
      };
    } else {
      callback({ success: false });
    }
  };
  getRequest.onerror = (event) => {
    callback({ success: false });
  };
};
