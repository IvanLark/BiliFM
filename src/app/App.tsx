import React, { useState, useEffect, useMemo } from 'react';
import { Song, Playlist } from '../storage/storage.type';
import SongSection from './components/SongSection';
import PlaylistSection from './components/PlaylistSection';
import AudioPlayer from './components/AudioPlayer';
import CreatePlaylistModal from './components/CreatePlaylistModal';
import AddToPlaylistModal from './components/AddToPlaylistModal';
import SettingsModal from './components/SettingsModal'; // 添加设置模态框
import DeleteConfirmModal from './components/DeleteConfirmModal';
import { ToastContainer } from './components/Toast';
import { toast } from './utils/toast';

// 定义播放模式类型
export type PlaybackMode = 'ORDER' | 'LOOP' | 'RANDOM';

const App: React.FC = () => {
  // 状态管理
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false); // 添加设置模态框状态

  const [deleteConfirmModalData, setDeleteConfirmModalData] = useState<{
    title: string;
    content: string;
    onConfirm: () => void;
  } | null>(null);

  // 播放
  const [isPlaying, setIsPlaying] = useState(false); // 播放状态
  const [volume, setVolume] = useState(0.7); // 音量默认 70%
  const [isMuted, setIsMuted] = useState(false); // 是否静音

  // 播放模式和倍速
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('ORDER'); // 播放模式，默认为顺序播放
  const [playbackRate, setPlaybackRate] = useState(1); // 播放倍速，默认为 1x

  // 主题
  const [currentTheme, setCurrentTheme] = useState<string>('light');

  // 初始化数据
  useEffect(() => {
    fetchAllSongs();
    fetchAllPlaylists();
    
    // 恢复上次的播放状态
    const savedVolume = localStorage.getItem('volume');
    if (savedVolume) {
      setVolume(parseFloat(savedVolume));
    }
    
    const savedMuted = localStorage.getItem('isMuted');
    if (savedMuted) {
      setIsMuted(savedMuted === 'true');
    }

    // 恢复播放模式和倍速
    const savedPlaybackMode = localStorage.getItem('playbackMode') as PlaybackMode | null;
    if (savedPlaybackMode && ['ORDER', 'LOOP', 'RANDOM'].includes(savedPlaybackMode)) {
      setPlaybackMode(savedPlaybackMode);
    }
    const savedPlaybackRate = localStorage.getItem('playbackRate');
    if (savedPlaybackRate) {
      const rate = parseFloat(savedPlaybackRate);
      if (!isNaN(rate) && [0.5, 1, 1.5, 2].includes(rate)) {
          setPlaybackRate(rate);
      }
    }

    // 恢复主题设置
    const savedTheme = localStorage.getItem('biliplayer_theme');
    if (savedTheme) {
      setCurrentTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      // 默认主题设置
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  // 保存音量设置
  useEffect(() => {
    localStorage.setItem('volume', volume.toString());
    localStorage.setItem('isMuted', isMuted.toString());
  }, [volume, isMuted]);

  // 保存播放模式和倍速设置
  useEffect(() => {
    localStorage.setItem('playbackMode', playbackMode);
    localStorage.setItem('playbackRate', playbackRate.toString());
  }, [playbackMode, playbackRate]);

  // 获取所有歌曲
  const fetchAllSongs = () => {
    chrome.runtime.sendMessage(
      { action: 'get_all_songs' },
      (response) => {
        if (response && response.success) {
          setSongs(response.songs as Song[] || []);
        } else {
          toast.error(`获取歌曲失败: ${response?.error || '未知错误'}`);
        }
      }
    );
  };

  // 获取所有歌单
  const fetchAllPlaylists = (callback?: (playlists: Playlist[]) => void) => {
    chrome.runtime.sendMessage(
      { action: 'get_all_playlists' },
      (response) => {
        if (response && response.success) {
          const newPlaylists = response.playlists as Playlist[] || [];
          setPlaylists(newPlaylists);
          callback?.(newPlaylists);
        } else {
          toast.error(`获取歌单失败: ${response?.error || '未知错误'}`);
        }
      }
    );
  };

  // 创建歌单
  const handleCreatePlaylist = (name: string, description: string, coverData: string | null = null) => {
    const newPlaylist: Omit<Playlist, 'id'> = {
      name,
      description,
      cover: coverData,
      ctime: Math.floor(Date.now() / 1000),
      songs: []
    };

    chrome.runtime.sendMessage(
      { action: 'add_playlist', data: newPlaylist },
      (response) => {
        if (response && response.success) {
          fetchAllPlaylists();
          setShowCreatePlaylistModal(false);
          toast.success(`歌单 "${name}" 创建成功`);
        } else {
          console.error("创建歌单失败:", response?.error || "未知错误");
          toast.error(`创建歌单失败: ${response?.error || '未知错误'}`);
        }
      }
    );
  };

  // 删除歌单
  const handleDeletePlaylist = () => {
    if (!currentPlaylist) return;
    const playlistName = currentPlaylist.name;
    
    chrome.runtime.sendMessage(
      { action: 'delete_playlist', playlistId: currentPlaylist.id },
      (response) => {
        if (response && response.success) {
          fetchAllPlaylists();
          setCurrentPlaylist(null);
          toast.success(`歌单 "${playlistName}" 已删除`);
        } else {
          console.error("删除歌单失败:", response?.error || "未知错误");
          toast.error(`删除歌单失败: ${response?.error || '未知错误'}`);
        }
      }
    );
  };

  // 删除歌曲
  const handleDeleteSong = (songId: number) => {
    const songToDelete = songs.find(s => s.id === songId);
    const songTitle = songToDelete?.title || `ID: ${songId}`;
    
    chrome.runtime.sendMessage(
      { action: 'delete_song', songId },
      (response) => {
        if (response && response.success) {
          fetchAllSongs();
          // 如果删除的是当前播放歌曲，停止播放
          if (currentSong && currentSong.id === songId) {
            setCurrentSong(null);
            setCurrentSongIndex(-1);
            setIsPlaying(false);
          }
          toast.success(`歌曲 "${songTitle}" 已删除`);
        } else {
          console.error("删除歌曲失败:", response?.error || "未知错误");
          toast.error(`删除歌曲失败: ${response?.error || '未知错误'}`);
        }
      }
    );
  };

  // 添加歌曲到歌单
  const handleAddToPlaylist = (playlistId: number, songId: number) => {
    const playlist = playlists.find(p => p.id === playlistId);
    const song = songs.find(s => s.id === songId);
    
    chrome.runtime.sendMessage(
      { action: 'add_song_to_playlist', playlistId, songId },
      (response) => {
        if (response && response.success) {
          fetchAllPlaylists();
          toast.success(`歌曲 "${song?.title || ''}" 已添加到歌单 "${playlist?.name || ''}"`);
        } else {
          console.error("添加到歌单失败:", response?.error || "未知错误");
          toast.error(`添加到歌单失败: ${response?.error || '未知错误'}`);
        }
      }
    );
  };

  // 从歌单中移除歌曲
  const handleRemoveFromPlaylist = (songId: number) => {
    if (!currentPlaylist) return;
    
    const playlistName = currentPlaylist.name;
    const song = songs.find(s => s.id === songId);
    const songTitle = song?.title || `ID: ${songId}`;
    
    chrome.runtime.sendMessage(
      { action: 'remove_song_from_playlist', playlistId: currentPlaylist.id, songId },
      (response) => {
        if (response && response.success) {
          fetchAllPlaylists((newPlaylists) => {
            // 刷新当前歌单
            if (currentPlaylist) {
              const updatedPlaylist = newPlaylists.find(p => p.id === currentPlaylist.id);
              if (updatedPlaylist) {
                setCurrentPlaylist(updatedPlaylist);
              }
              
              // 如果移除的是当前播放歌曲，处理播放状态
              if (currentSong && currentSong.id === songId) {
                handleNext();
              }
            }
          });
          toast.success(`已从歌单 "${playlistName}" 中移除歌曲 "${songTitle}"`);
        } else {
          console.error("从歌单移除失败:", response?.error || "未知错误");
          toast.error(`从歌单移除失败: ${response?.error || '未知错误'}`);
        }
      }
    );
  };

  // 处理歌单选择
  const handleSelectPlaylist = (playlistId: number) => {
    if (playlistId === -1) {
      setCurrentPlaylist(null);
    } else {
      const playlist = playlists.find(p => p.id === playlistId);
      if (playlist) {
        setCurrentPlaylist(playlist);
      }
    }
  };

  // 播放指定索引的歌曲
  const handlePlaySong = (index: number) => {
    const songList = currentSongList;
    if (index >= 0 && index < songList.length) {
      const song = songList[index];
      if (currentSongIndex === index && currentSong?.id === song.id) {
        // 点击同一首歌，切换播放/暂停状态
        setIsPlaying(!isPlaying);
      } else {
        setCurrentSong(song);
        setCurrentSongIndex(index);
        setIsPlaying(true);
      }
    }
  };

  // 播放全部歌曲
  const handlePlayAll = () => {
    const songList = currentSongList;
    if (songList.length > 0) {
      handlePlaySong(0);
    }
  };

  // 暂停播放
  const handlePause = () => {
    setIsPlaying(false);
  };

  // 播放下一首
  const handleNext = () => {
    const songList = currentSongList;
    if (songList.length === 0) return;
    
    let nextIndex;
    if (playbackMode === 'RANDOM') {
      // 随机播放 - 确保不连续播放同一首
      if (songList.length === 1) {
        nextIndex = 0;
      } else {
        do {
          nextIndex = Math.floor(Math.random() * songList.length);
        } while (nextIndex === currentSongIndex);
      }
    } else {
      // 顺序播放 或 单曲循环（在 handleEnded 中处理循环）
      nextIndex = (currentSongIndex + 1) % songList.length;
    }
    handlePlaySong(nextIndex);
  };

  // 播放上一首
  const handlePrev = () => {
    const songList = currentSongList;
    if (songList.length === 0) return;
    
    let prevIndex;
    if (playbackMode === 'RANDOM') {
      // 随机播放 - 确保不连续播放同一首
       if (songList.length === 1) {
        prevIndex = 0;
      } else {
        do {
          prevIndex = Math.floor(Math.random() * songList.length);
        } while (prevIndex === currentSongIndex);
      }
    } else {
      // 顺序播放 或 单曲循环
      // 如果是第一首则跳到最后一首
      prevIndex = (currentSongIndex - 1 + songList.length) % songList.length;
    }
    
    handlePlaySong(prevIndex);
  };

  // 处理播放完毕
  const handleEnded = () => {
    // 单曲循环模式由 audio 元素的 loop 属性处理，这里不需要操作
    if (playbackMode !== 'LOOP') {
      handleNext(); // 顺序或随机播放模式下，播放下一首
    }
  };

  // 获取当前歌曲列表
  const currentSongList = useMemo((): Song[] => {
    if (currentPlaylist && currentPlaylist.songs) {
      // 返回歌单中的歌曲
      return currentPlaylist.songs
        .map(id => songs.find(s => s.id === id))
        .filter((song): song is Song => !!song);
    } else {
      // 返回所有歌曲
      return songs;
    }
  }, [currentPlaylist, songs]);

  // 切换主题
  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('biliplayer_theme', themeId);
    toast.info(`主题已切换为 ${themeId}`);
  };

  // 切换播放模式
  const handlePlaybackModeToggle = () => {
    // 避免函数式更新导致 toast.info 执行两次，直接用当前 playbackMode
    let nextMode: PlaybackMode;
    let modeName: string;

    if (playbackMode === 'ORDER') {
      nextMode = 'LOOP';
      modeName = '单曲循环';
    } else if (playbackMode === 'LOOP') {
      nextMode = 'RANDOM';
      modeName = '随机播放';
    } else {
      nextMode = 'ORDER';
      modeName = '顺序播放';
    }
    setPlaybackMode(nextMode);
    toast.info(`播放模式: ${modeName}`);
  };

  // 切换播放倍速 (循环切换: 1 -> 1.5 -> 2 -> 0.5 -> 1)
  const handlePlaybackRateCycle = () => {
    const rates = [1, 1.5, 2, 0.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const nextRate = rates[nextIndex];
    setPlaybackRate(nextRate);
    toast.info(`播放速度: ${nextRate}x`);
  };

  const onDeletePlaylist = () => {
    setDeleteConfirmModalData({
      title: '删除歌单',
      content: '确定要删除当前歌单吗？',
      onConfirm: handleDeletePlaylist
    });
    setShowDeleteConfirmModal(true);
  }

  const onRemoveFromPlaylist = (songId: number) => {
    setDeleteConfirmModalData({
      title: '移除歌曲',
      content: '确定要从当前歌单中移除当前歌曲吗？',
      onConfirm: () => handleRemoveFromPlaylist(songId)
    });
    setShowDeleteConfirmModal(true);
  }

  const onDeleteSong = (songId: number) => {
    setDeleteConfirmModalData({
      title: '删除歌曲',
      content: '确定要删除当前歌曲吗？',
      onConfirm: () => handleDeleteSong(songId)
    });
    setShowDeleteConfirmModal(true);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "song_update") {
      console.log("收到歌曲更新消息");
      fetchAllSongs();
    }
    if (message.action === "playlist_update") {
      console.log("收到歌单更新消息");
      fetchAllPlaylists();
    }
  });

  return (
    <div id="main-container" className="flex flex-row h-screen">
      {/* 左侧歌单区 */}
      <PlaylistSection
        playlists={playlists}
        currentPlaylistId={currentPlaylist?.id || null}
        onSelectPlaylist={handleSelectPlaylist}
        onCreatePlaylistClick={() => setShowCreatePlaylistModal(true)}
      />
      
      {/* 右侧歌曲区 */}
      <main id="song-section" className="flex-1 bg-base-200 px-10 py-8 overflow-y-auto relative pt-16">
        {/* 设置按钮 */}
        <div className="absolute top-4 right-6 z-10">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setShowSettingsModal(true)}
            aria-label="设置"
            title="设置"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.986.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z" clipRule="evenodd" />
            </svg>
            <span className="hidden md:inline ml-1">设置</span>
          </button>
        </div>
        
        {/* 歌曲区域 */}
        <SongSection
          songs={currentSongList}
          currentPlaylist={currentPlaylist}
          currentSongId={currentSong?.id || null}
          onPlaySong={handlePlaySong}
          onPlayAll={handlePlayAll}
          onDeletePlaylist={onDeletePlaylist}
          onAddToPlaylist={(songId) => {
            setSelectedSongId(songId);
            setShowAddToPlaylistModal(true);
          }}
          onRemoveFromPlaylist={onRemoveFromPlaylist}
          onDeleteSong={onDeleteSong}
        />
      </main>
      
      {/* 底部播放器 */}
      <AudioPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        playbackMode={playbackMode} // 传递播放模式
        playbackRate={playbackRate} // 传递播放倍速
        onPlay={() => setIsPlaying(true)}
        onPause={handlePause}
        onNext={handleNext}
        onPrev={handlePrev}
        onEnded={handleEnded}
        onVolumeChange={setVolume}
        onMuteToggle={() => setIsMuted(!isMuted)}
        onPlaybackModeToggle={handlePlaybackModeToggle} // 传递切换模式函数
        onPlaybackRateCycle={handlePlaybackRateCycle} // 传递切换倍速函数
      />
      
      {/* 模态框 */}
      <CreatePlaylistModal
        isOpen={showCreatePlaylistModal}
        onClose={() => setShowCreatePlaylistModal(false)}
        onCreate={handleCreatePlaylist}
      />
      
      <AddToPlaylistModal
        isOpen={showAddToPlaylistModal}
        playlists={playlists}
        currentSongId={selectedSongId}
        onClose={() => setShowAddToPlaylistModal(false)}
        onAddToPlaylist={handleAddToPlaylist}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirmModal}
        onClose={() => setShowDeleteConfirmModal(false)}
        onConfirm={deleteConfirmModalData?.onConfirm || (() => {})}
        title={deleteConfirmModalData?.title || ''}
        content={deleteConfirmModalData?.content || ''}
      />
      
      {/* 设置模态框 */}
      <SettingsModal
        isOpen={showSettingsModal}
        currentTheme={currentTheme}
        onClose={() => setShowSettingsModal(false)}
        onThemeChange={handleThemeChange}
        onImportDataSuccess={() => {
          fetchAllSongs();
          fetchAllPlaylists();
          setShowSettingsModal(false);
          toast.success('数据导入成功');
        }}
      />
      
      {/* Toast 通知容器 */}
      <ToastContainer />
    </div>
  );
};

export default App;