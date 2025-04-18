import React, { useState } from 'react';
import { Playlist } from '../../storage/storage.type';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic, faListUl, faCompactDisc } from '@fortawesome/free-solid-svg-icons';

interface PlaylistSectionProps {
  playlists: Playlist[];
  currentPlaylistId: number | null;
  onSelectPlaylist: (id: number) => void;
  onCreatePlaylistClick: () => void;
}

const PlaylistSection: React.FC<PlaylistSectionProps> = ({
  playlists,
  currentPlaylistId,
  onSelectPlaylist,
  onCreatePlaylistClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // 筛选匹配搜索词的歌单
  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside id="playlist-section" className="w-72 min-w-[220px] max-w-[320px] flex flex-col shadow-md bg-base-100 h-screen overflow-hidden">
      {/* Logo和标题 */}
      <div className="p-4 flex items-center gap-3 border-b border-base-300">
        <img src="/icon.png" alt="Logo" className="w-8 h-8" />
        <h1 className="text-lg font-semibold text-base-content">BiliFM</h1>
      </div>
      
      {/* 搜索和创建歌单按钮 */}
      <div className="p-4 flex flex-col gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索歌单..."
            className="input input-sm input-bordered w-full pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
              onClick={() => setSearchTerm('')}
              aria-label="清除搜索"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          )}
        </div>
        
        {/* 创建歌单按钮 */}
        <button
          className="btn btn-primary btn-sm gap-2 w-full"
          onClick={onCreatePlaylistClick}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          创建歌单
        </button>
      </div>
      
      {/* 歌曲库区域 */}
      <div className="px-4 pt-2 pb-4">
        <div className="section-title flex justify-between items-center">
          <div>
            {/* <i className="fas fa-music mr-2"></i> */}
            <FontAwesomeIcon icon={faMusic} className="mr-2" />
            音乐库
          </div>
        </div>
        
        <ul className="w-full menu menu-md">
          <li>
            <a 
              id="playlist-all" 
              className={`playlist-item flex items-center ${currentPlaylistId === null ? 'active bg-base-200 text-primary font-medium' : ''}`}
              onClick={() => onSelectPlaylist(-1)} // 使用-1表示显示全部歌曲
            >
              {/* <i className="fas fa-compact-disc mr-2"></i> */}
              <FontAwesomeIcon icon={faCompactDisc} className="mr-2" />
              全部歌曲
            </a>
          </li>
        </ul>
      </div>
      
      {/* 我的歌单区域 */}
      <div className="px-4 pt-2 pb-4 flex-1 flex flex-col overflow-hidden">
        <div className="section-title flex justify-between items-center mb-2">
          <div>
            {/* <i className="fas fa-list-ul mr-2"></i> */}
            <FontAwesomeIcon icon={faListUl} className="mr-2" />
            我的歌单
          </div>
        </div>
        
        <ul className="menu menu-sm bg-base-100 w-full rounded-md flex-1 overflow-y-auto">
          {filteredPlaylists.length === 0 ? (
            <li className="text-center py-3 text-base-content/50">
              {searchTerm ? "未找到匹配歌单" : "暂无歌单"}
            </li>
          ) : (
            filteredPlaylists.map(playlist => (
              <li key={playlist.id} className="playlist-item">
                <button
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    currentPlaylistId === playlist.id ? 'bg-base-200 text-primary font-medium' : ''
                  }`}
                  onClick={() => onSelectPlaylist(playlist.id)}
                >
                  <div className="avatar">
                    <div className="w-8 h-8 rounded">
                      <img
                        src={playlist.cover || "/icon.png"}
                        alt={playlist.name}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/icon.png";
                        }}
                      />
                    </div>
                  </div>
                  <span className="playlist-name truncate">{playlist.name}</span>
                  {playlist.songs && (
                    <span className="badge badge-sm ml-auto">{playlist.songs.length}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
};

export default PlaylistSection;