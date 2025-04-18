import React from 'react';
import { Song } from '../../storage/storage.type';

interface SongItemProps {
  song: Song;
  index: number;
  isActive: boolean;
  isInPlaylist: boolean;
  onPlay: (index: number) => void;
  onAddToPlaylist: (songId: number) => void;
  onRemoveFromPlaylist: (songId: number) => void;
  onDeleteSong: (songId: number) => void;
}

const SongItem: React.FC<SongItemProps> = ({
  song,
  index,
  isActive,
  isInPlaylist,
  onPlay,
  onAddToPlaylist,
  onRemoveFromPlaylist,
  onDeleteSong
}) => {
  // 格式化时间为 MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮区域，不触发播放
    if ((e.target as HTMLElement).closest('.song-actions')) {
      return;
    }
    onPlay(index);
  };

  // 处理添加到歌单
  const handleAddToPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (song.id) {
      onAddToPlaylist(song.id);
    }
  };

  // 处理从歌单移除
  const handleRemoveFromPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (song.id) {
      onRemoveFromPlaylist(song.id);
    }
  };

  // 处理删除歌曲
  const handleDeleteSong = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (song.id) {
      onDeleteSong(song.id);
    }
  };

  return (
    <li
      className={`song-item flex items-center p-3 rounded-lg cursor-pointer transition-all duration-150 select-none hover:bg-base-100 ${
        isActive ? 'bg-base-300 shadow-sm' : ''
      }`}
      onClick={handleClick}
      data-idx={index}
      data-song-id={song.id}
    >
      <div className="avatar mr-4">
        <div className="w-12 rounded">
          <img
            className="song-cover"
            src={song.cover || "/icon.png"}
            alt="cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/icon.png";
            }}
          />
        </div>
      </div>
      <div className="song-info flex-1 flex flex-col min-w-0 mr-4">
        <div className="flex items-baseline gap-2">
          <div
            className={`song-title text-base font-semibold truncate ${
              isActive ? 'text-primary' : 'text-base-content'
            }`}
          >
            {song.title}
          </div>
          <span className="text-xs text-base-content/50 tabular-nums">
            {formatTime(song.duration)}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="avatar">
            <div className="w-5 rounded-full">
              <img
                src={song.author?.avatar || "/icon.png"}
                alt="author"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/icon.png";
                }}
              />
            </div>
          </div>
          <span className="song-author text-sm text-base-content/70 truncate">
            {song.author?.name || "未知艺术家"}
          </span>
        </div>
      </div>
      <div className="song-actions flex flex-col sm:flex-row gap-2 ml-auto">
        {!isInPlaylist ? (
          <>
            <button
              className="btn btn-xs btn-outline btn-info add-to-playlist-btn"
              onClick={handleAddToPlaylist}
            >
              添加到歌单
            </button>
            <button
              className="btn btn-xs btn-outline btn-error delete-song-btn"
              onClick={handleDeleteSong}
            >
              删除
            </button>
          </>
        ) : (
          <button
            className="btn btn-xs btn-outline btn-warning remove-from-playlist-btn"
            onClick={handleRemoveFromPlaylist}
          >
            移出歌单
          </button>
        )}
      </div>
    </li>
  );
};

export default SongItem;