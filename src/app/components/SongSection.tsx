import React, { useState } from 'react';
import { Song, Playlist } from '../../storage/storage.type';
import PlaylistDetail from './PlaylistDetail';
import SongItem from './SongItem';

interface SongSectionProps {
  songs: Song[];
  currentPlaylist: Playlist | null;
  currentSongId: number | null;
  onPlaySong: (index: number) => void;
  onPlayAll: () => void;
  onDeletePlaylist: () => void;
  onAddToPlaylist: (songId: number) => void;
  onRemoveFromPlaylist: (songId: number) => void;
  onDeleteSong: (songId: number) => void;
}

const SongSection: React.FC<SongSectionProps> = ({
  songs,
  currentPlaylist,
  currentSongId,
  onPlaySong,
  onPlayAll,
  onDeletePlaylist,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onDeleteSong
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // 筛选匹配搜索词的歌曲
  const filteredSongs = songs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (song.author?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 判断是否为当前播放列表的歌曲
  const isInPlaylist = (song: Song): boolean => {
    if (!currentPlaylist || !currentPlaylist.songs || !song.id) return false;
    return currentPlaylist.songs.includes(song.id);
  };

  return (
    <section className="song-section flex-1 overflow-y-auto pb-32 p-4">
      {/* 歌单详情 */}
      {currentPlaylist && (
        <PlaylistDetail
          playlist={currentPlaylist}
          onPlayAll={onPlayAll}
          onDeletePlaylist={onDeletePlaylist}
        />
      )}
      
      {/* 搜索框 */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="搜索歌曲..."
          className="input input-bordered w-full pr-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle"
            onClick={() => setSearchTerm('')}
            aria-label="清除搜索"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        )}
      </div>
      
      {/* 歌曲列表 */}
      {filteredSongs.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-xl font-semibold text-base-content/70 mb-2">
            {searchTerm ? "未找到匹配歌曲" : "暂无歌曲"}
          </div>
          <p className="text-base-content/50">
            {searchTerm 
              ? "请尝试其他关键词搜索" 
              : "请使用B站视频页面的收藏按钮添加歌曲"}
          </p>
        </div>
      ) : (
        <ul className="song-list space-y-2">
          {filteredSongs.map((song, index) => (
            <SongItem
              key={song.id}
              song={song}
              index={index}
              isActive={song.id === currentSongId}
              isInPlaylist={isInPlaylist(song)}
              onPlay={onPlaySong}
              onAddToPlaylist={onAddToPlaylist}
              onRemoveFromPlaylist={onRemoveFromPlaylist}
              onDeleteSong={onDeleteSong}
            />
          ))}
        </ul>
      )}
    </section>
  );
};

export default SongSection;