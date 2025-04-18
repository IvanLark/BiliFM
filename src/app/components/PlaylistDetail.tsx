import React from 'react';
import { Playlist } from '../../storage/storage.type';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay, faTrash } from '@fortawesome/free-solid-svg-icons'

interface PlaylistDetailProps {
  playlist: Playlist;
  onPlayAll: () => void;
  onDeletePlaylist: () => void;
}

const PlaylistDetail: React.FC<PlaylistDetailProps> = ({
  playlist,
  onPlayAll,
  onDeletePlaylist
}) => {
  const name = playlist.name || "未命名歌单";
  const description = playlist.description || "暂无描述";
  const count = (playlist.songs || []).length;
  const cover = playlist.cover || "/icon.png";

  const handleDeletePlaylist = () => {
    onDeletePlaylist();
  };

  return (
    <div className="card card-side bg-base-100 shadow-md mb-6 flex-col sm:flex-row">
      <figure className="p-4 sm:p-0 sm:pl-5 flex-shrink-0">
        <img
          src={cover}
          className="w-32 h-32 object-cover rounded-lg shadow-sm"
          alt="歌单封面"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/icon.png";
          }}
        />
      </figure>
      <div className="card-body flex-1 min-w-0">
        <h2 className="card-title text-2xl font-bold mb-1">{name}</h2>
        <p className="text-sm text-base-content/70 mb-3">{description}</p>
        <div className="card-actions items-center justify-start gap-4 mt-auto">
          <button
            id="playlist-playall"
            className="btn btn-primary gap-1"
            disabled={count === 0}
            onClick={onPlayAll}
          >
            {/* <i className="fas fa-play mr-1"></i> */}
            <FontAwesomeIcon icon={faPlay} className="mr-1" />
            播放全部
          </button>
          <button
            id="delete-playlist-btn"
            className="btn btn-error btn-outline gap-1"
            onClick={handleDeletePlaylist}
          >
            {/* <i className="fas fa-trash mr-1"></i>  */}
            <FontAwesomeIcon icon={faTrash} className="mr-1" />
            删除歌单
          </button>
          <span className="text-xs text-base-content/50 ml-auto hidden sm:inline">
            共 {count} 首歌
          </span>
        </div>
        <span className="text-xs text-base-content/50 mt-2 sm:hidden">
          共 {count} 首歌
        </span>
      </div>
    </div>
  );
};

export default PlaylistDetail;