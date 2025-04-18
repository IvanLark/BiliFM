import React, { useState, useEffect } from 'react';
import { Song, Playlist } from '../../storage/storage.type';
import { getSong } from '../utils';

// 初始化
const init = async (): Promise<{ song: Song; playlists: Playlist[] }> => {
  const song = await getSong();
  console.log("初始化提取到的song", song);
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      {
        action: "collect_card_init",
        data: song,
      },
      (response: { isExist?: boolean; id?: number; playlists: Playlist[] }) => {
        if (response.isExist !== undefined) {
          song.isExist = response.isExist;
        }
        const playlists = response.playlists || [];
        if (response.isExist && response.id) {
          song.id = response.id;
        }
        resolve({ song, playlists });
      }
    );
  });
};

const CollectCard: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [song, setSong] = useState<Song | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);

  // 初始化
  useEffect(() => {
    init().then(({ song, playlists }) => {
      setSong(song);
      setPlaylists(playlists);
      if (playlists.length > 0) {
        setSelectedPlaylistId(playlists[0].id);
      }
      setIsLoading(false);
    }).catch((error) => {
      console.error("初始化失败", error);
      alert("初始化失败，请刷新页面");
    });
  }, []);

  // 收藏歌曲
  const collectSong = () => {
    chrome.runtime.sendMessage(
      { action: "collect_song", data: song },
      (response: { success: boolean; id: number }) => {
        if (response.success) {
          setSong(prev => prev ? { ...prev, id: response.id, isExist: true } : null);
          alert("歌曲已收藏！");
        } else {
          alert("收藏失败！");
        }
      }
    );
  };

  // 添加歌曲到指定歌单
  const addToPlaylist = () => {
    if (!song?.id) {
      alert("请先收藏歌曲");
      return;
    }
    if (!selectedPlaylistId) {
      alert("请选择一个歌单");
      return;
    }
    chrome.runtime.sendMessage(
      {
        action: "add_song_to_playlist",
        songId: song.id as number,
        playlistId: selectedPlaylistId,
      },
      (response: { success: boolean }) => {
        if (response.success) {
          const playlistName = playlists.find(
            (p) => p.id === selectedPlaylistId
          )?.name;
          alert(`歌曲已添加到 ${playlistName}！`);
        } else {
          alert("操作失败，请重试！");
        }
      }
    );
  };

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlaylistId(Number(e.target.value));
  };

  if (isLoading) return null;

  return (
    <div className="collect-card">
      <h3>bilibili音乐收藏</h3>
      
      <button 
        className="collect-song-button" 
        disabled={song?.isExist}
        onClick={collectSong}
      >
        {song?.isExist ? "已收藏" : "收藏歌曲"}
      </button>
      
      <div className="playlist-row">
        <label htmlFor="playlist-select">歌单</label>
        <select 
          id="playlist-select"
          value={selectedPlaylistId || ""}
          onChange={handlePlaylistChange}
        >
          {playlists.length > 0 ? (
            playlists.map((playlist) => (
              <option key={playlist.id} value={playlist.id}>
                {playlist.name}
              </option>
            ))
          ) : (
            <option value="" disabled>
              暂无歌单
            </option>
          )}
        </select>
        <button 
          className="add-to-playlist-button"
          onClick={addToPlaylist}
        >
          收集进指定歌单
        </button>
      </div>
    </div>
  );
};

export default CollectCard;