import { Song, Playlist } from './storage.type';

const dbName = "BiliFM";
const dbVersion = 3;
const dbStoreNames = {
  PLAYLISTS: "playlists", // 歌单存储
  SONGS: "songs", // 歌曲存储
};

let dbInstance: IDBDatabase | null = null;

// 初始化 IndexedDB 数据库
export const initDatabase = (): void => {
  const request = indexedDB.open(dbName, dbVersion); // 打开或创建数据库

  // 数据库版本升级时触发
  request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
    const db = (event.target as IDBOpenDBRequest).result; // 获取数据库实例
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
  request.onsuccess = (event: Event) => {
    dbInstance = (event.target as IDBOpenDBRequest).result; // 存储数据库实例
    console.log("IndexedDB 初始化成功"); // 输出成功日志
  };

  // 数据库打开失败时触发
  request.onerror = (event: Event) => {
    console.error("IndexedDB 初始化失败", (event.target as IDBOpenDBRequest).error); // 输出错误日志
  };
};

interface AddPlaylistCallback {
  id: number | null;
  success: boolean;
}

// 添加歌单到 IndexedDB
export const addPlaylist = (
  playlist: Omit<Playlist, 'id'>, 
  callback: (result: AddPlaylistCallback) => void
): void => {
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
    callback({ id: addRequest.result as number, success: true }); // 调用回调函数，传递成功状态
  };

  // 添加失败时触发
  addRequest.onerror = (event: Event) => {
    console.error("歌单添加失败", (event.target as IDBRequest).error); // 输出错误日志
    callback({ id: null, success: false }); // 调用回调函数，传递失败状态
  };
};

interface GetAllPlaylistsCallback {
  success: boolean;
  playlists: Playlist[];
}

// 获取所有歌单
export const getAllPlaylists = (callback: (result: GetAllPlaylistsCallback) => void): void => {
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
  const playlists: Playlist[] = []; // 用于存储所有歌单

  // 遍历对象存储中的所有记录
  store.openCursor().onsuccess = (event: Event) => {
    const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result; // 获取游标
    if (cursor) {
      playlists.push(cursor.value as Playlist); // 将当前记录添加到数组
      cursor.continue(); // 移动到下一个记录
    } else {
      // 对 playlists 根据id从大到小进行排序
      playlists.sort((a, b) => b.id - a.id);
      callback({ success: true, playlists }); // 遍历完成后调用回调函数，传递歌单数组
    }
  };
};

interface SimpleCallback {
  success: boolean;
}

// 删除歌单
export const deletePlaylistById = (
  id: number | string, 
  callback: (result: SimpleCallback) => void
): void => {
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

  deleteRequest.onerror = (event: Event) => {
    console.error("歌单删除失败", (event.target as IDBRequest).error);
    callback({ success: false });
  };
};

interface AddSongCallback {
  id: number | null;
  success: boolean;
}

// 添加歌曲
export const addSong = (
  song: Omit<Song, 'id'>, 
  callback: (result: AddSongCallback) => void
): void => {
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
    callback({ id: addRequest.result as number, success: true });
  };
  
  addRequest.onerror = (event: Event) => {
    console.error("歌曲添加失败", (event.target as IDBRequest).error);
    callback({ id: null, success: false });
  };
};

interface GetAllSongsCallback {
  success: boolean;
  songs: Song[];
}

// 获取所有歌曲
export const getAllSongs = (callback: (result: GetAllSongsCallback) => void): void => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false, songs: [] });
    return;
  }

  const transaction = dbInstance.transaction(dbStoreNames.SONGS, "readonly");
  const store = transaction.objectStore(dbStoreNames.SONGS);
  const songs: Song[] = [];

  store.openCursor().onsuccess = (event: Event) => {
    const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
    if (cursor) {
      songs.push(cursor.value as Song);
      cursor.continue();
    } else {
      // 对 songs 根据id从大到小进行排序
      songs.sort((a, b) => (b.id || 0) - (a.id || 0));
      callback({ success: true, songs });
    }
  };

  transaction.onerror = (event: Event) => {
    console.error("获取歌曲失败", (event.target as IDBTransaction).error);
    callback({ success: false, songs: [] });
  };
};

interface GetPlaylistByIdCallback {
  success: boolean;
  playlist: Playlist | null;
}

// 根据id获取歌单
export const getPlaylistById = (
  id: number | string, 
  callback: (result: GetPlaylistByIdCallback) => void
): void => {
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

  request.onsuccess = (event: Event) => {
    const playlist = (event.target as IDBRequest<Playlist>).result;
    callback({ success: true, playlist }); // 返回歌单对象或 null
  };

  request.onerror = (event: Event) => {
    console.error("获取歌单失败", (event.target as IDBRequest).error);
    callback({ success: false, playlist: null });
  };
};

// 添加歌曲到歌单
export const addSongToPlaylist = (
  playlistId: number | string, 
  songId: number | string, 
  callback: (result: SimpleCallback) => void
): void => {
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

  getRequest.onsuccess = (event: Event) => {
    const playlist = (event.target as IDBRequest<Playlist>).result;
    if (playlist) {
      if (!playlist.songs) playlist.songs = []; // 如果 songs 数组不存在，初始化它
      if (!playlist.songs.includes(songId as number)) {
        playlist.songs.push(songId as number); // 添加歌曲 ID
        const updateRequest = store.put(playlist); // 更新歌单
        updateRequest.onsuccess = () => {
          console.log("歌曲添加到歌单成功");
          callback({ success: true });
        };
        updateRequest.onerror = (event: Event) => {
          console.error("更新歌单失败", (event.target as IDBRequest).error);
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

  getRequest.onerror = (event: Event) => {
    console.error("获取歌单失败", (event.target as IDBRequest).error);
    callback({ success: false });
  };
};

// 删除歌曲
export const deleteSongById = (
  id: number | string, 
  callback: (result: SimpleCallback) => void
): void => {
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
    playlistStore.openCursor().onsuccess = (event: Event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const playlist = cursor.value as Playlist;
        if (playlist.songs && playlist.songs.includes(id as number)) {
          const index = playlist.songs.indexOf(id as number);
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

  deleteRequest.onerror = (event: Event) => {
    console.error("歌曲删除失败", (event.target as IDBRequest).error);
    callback({ success: false });
  };
};

interface CheckSongExistsCallback {
  success: boolean;
  isExist?: boolean;
  id?: number;
}

// 检查歌曲是否存在
export const checkSongExists = (
  bvid: string, 
  page: number | string, 
  callback: (result: CheckSongExistsCallback) => void
): void => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false });
    return;
  }

  if (typeof page === "string") {
    page = Number(page);
  }

  const transaction = dbInstance.transaction(dbStoreNames.SONGS, "readonly");
  const store = transaction.objectStore(dbStoreNames.SONGS);
  const index = store.index("bvid");

  index.openCursor(IDBKeyRange.only(bvid)).onsuccess = (event: Event) => {
    const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
    if (cursor) {
      const song = cursor.value as Song;
      if (song.page === page) {
        callback({ success: true, isExist: true, id: song.id }); // 找到匹配的歌曲
        return;
      }
      cursor.continue(); // 继续检查下一个 bvid 相同的歌曲
    } else {
      callback({ success: true, isExist: false }); // 没有匹配的歌曲
    }
  };

  transaction.onerror = (event: Event) => {
    console.error("检查歌曲失败", (event.target as IDBTransaction).error);
    callback({ success: false });
  };
};

interface GetSongByIdCallback {
  success: boolean;
  song: Song | null;
}

// 根据id获取歌曲
export const getSongById = (
  id: number | string, 
  callback: (result: GetSongByIdCallback) => void
): void => {
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

  request.onsuccess = (event: Event) => {
    const song = (event.target as IDBRequest<Song>).result;
    callback({ success: true, song }); // 返回歌曲对象或 null
  };

  request.onerror = (event: Event) => {
    console.error("获取歌曲失败", (event.target as IDBRequest).error);
    callback({ success: false, song: null });
  };
};

// 从歌单移除歌曲
export const removeSongFromPlaylist = (
  playlistId: number | string, 
  songId: number | string, 
  callback: (result: SimpleCallback) => void
): void => {
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
  
  getRequest.onsuccess = (event: Event) => {
    const playlist = (event.target as IDBRequest<Playlist>).result;
    if (playlist) {
      playlist.songs = (playlist.songs || []).filter(
        (id) => id !== songId
      );
      const updateRequest = store.put(playlist);
      updateRequest.onsuccess = () => {
        callback({ success: true });
      };
      updateRequest.onerror = () => {
        callback({ success: false });
      };
    } else {
      callback({ success: false });
    }
  };
  
  getRequest.onerror = () => {
    callback({ success: false });
  };
};

// 导入数据
export const importData = (data: { songs: Song[]; playlists: Playlist[] }, callback: (result: SimpleCallback) => void): void => {
  if (!dbInstance) {
    console.error("数据库未初始化");
    callback({ success: false });
    return;
  }
  
  const songTransaction = dbInstance.transaction(
    dbStoreNames.SONGS,
    "readwrite"
  );
  const songStore = songTransaction.objectStore(dbStoreNames.SONGS);
  const songIdMap: Record<number, number> = {};
  for (const song of data.songs.filter((song) => song.id !== undefined)) {
    const newSong = {
      bvid: song.bvid,
      cid: song.cid,
      aid: song.aid,
      page: song.page,
      title: song.title,
      description: song.description,
      author: song.author,
      cover: song.cover,
      duration: song.duration,
      ctime: song.ctime,
    } as Omit<Song, 'id'>;
    const addRequest = songStore.add(newSong);
    addRequest.onsuccess = (event: Event) => {
      songIdMap[song.id as number] = (event.target as IDBRequest<number>).result as number;
    };
  }

  songTransaction.oncomplete = () => {
    const playlistTransaction = (dbInstance as IDBDatabase).transaction(
      dbStoreNames.PLAYLISTS,
      "readwrite"
    );
    const playlistStore = playlistTransaction.objectStore(dbStoreNames.PLAYLISTS);
    for (const playlist of data.playlists) {
      const newPlaylist = {
        name: playlist.name,
        description: playlist.description,
        cover: playlist.cover,
        ctime: playlist.ctime,
        songs: playlist.songs.map((songId) => songIdMap[songId])
      } as Omit<Playlist, 'id'>;
      playlistStore.add(newPlaylist);
    }
    playlistTransaction.oncomplete = () => {
      callback({ success: true });
    };
    playlistTransaction.onerror = () => {
      callback({ success: false });
    };
  };

  songTransaction.onerror = () => {
    callback({ success: false });
  };
}