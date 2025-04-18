import React, { useState, useRef, useEffect } from 'react';
import { Playlist } from '../../storage/storage.type';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  playlists: Playlist[];
  currentSongId: number | null;
  onClose: () => void;
  onAddToPlaylist: (playlistId: number, songId: number) => void;
}

const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  isOpen,
  playlists,
  currentSongId,
  onClose,
  onAddToPlaylist
}) => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef<HTMLDialogElement>(null);

  // 筛选符合搜索条件的歌单
  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 打开/关闭模态框
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  // 重置状态
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlaylistId(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  // 提交处理
  const handleSubmit = () => {
    if (selectedPlaylistId !== null && currentSongId !== null) {
      onAddToPlaylist(selectedPlaylistId, currentSongId);
      onClose();
    }
  };

  // 选择歌单
  const handleSelectPlaylist = (id: number) => {
    setSelectedPlaylistId(id);
  };

  return (
    <dialog ref={modalRef} className="modal" onClose={onClose}>
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">添加到歌单</h3>
        
        {/* 搜索框 */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="搜索歌单..."
            className="input input-bordered input-sm w-full pr-10"
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
        
        {/* 歌单列表 */}
        {filteredPlaylists.length === 0 ? (
          <div className="text-center py-4 text-base-content/70">
            {searchTerm ? "未找到匹配歌单" : "暂无歌单可选择"}
          </div>
        ) : (
          <div className="overflow-y-auto max-h-64 mb-4">
            <ul className="menu menu-sm bg-base-100 w-full rounded-box">
              {filteredPlaylists.map(playlist => {
                // 检查歌曲是否已在此歌单中
                const alreadyInPlaylist = playlist.songs?.includes(currentSongId || -1);
                
                return (
                  <li key={playlist.id}>
                    <button
                      className={`flex items-center gap-3 ${selectedPlaylistId === playlist.id ? 'active bg-primary text-primary-content' : ''}`}
                      onClick={() => handleSelectPlaylist(playlist.id)}
                      disabled={alreadyInPlaylist}
                    >
                      <div className="avatar">
                        <div className="w-6 h-6 rounded">
                          <img
                            src={playlist.cover || "/icon.png"}
                            alt={playlist.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/icon.png";
                            }}
                          />
                        </div>
                      </div>
                      <span className="truncate">{playlist.name}</span>
                      {playlist.songs && (
                        <span className="badge badge-sm ml-auto">{playlist.songs.length}</span>
                      )}
                      {alreadyInPlaylist && (
                        <span className="text-xs text-warning ml-2">(已在歌单中)</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        
        <div className="modal-action">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={onClose}
          >
            取消
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            disabled={selectedPlaylistId === null || currentSongId === null}
            onClick={handleSubmit}
          >
            添加
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>关闭</button>
      </form>
    </dialog>
  );
};

export default AddToPlaylistModal;