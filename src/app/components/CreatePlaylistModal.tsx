import React, { useState, useRef, useEffect } from 'react';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, coverData?: string | null) => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDesc, setPlaylistDesc] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('/icon.png');
  const modalRef = useRef<HTMLDialogElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 打开/关闭模态框
  useEffect(() => {
    if (isOpen) {
      modalRef.current?.showModal();
      // 聚焦到名称输入框
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    } else {
      modalRef.current?.close();
    }
  }, [isOpen]);

  // 模态框关闭时重置表单
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // 重置表单
  const resetForm = () => {
    setPlaylistName('');
    setPlaylistDesc('');
    setCoverFile(null);
    setCoverPreview('/icon.png');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理封面选择
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      
      // 预览图片
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setCoverPreview(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 移除封面
  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview('/icon.png');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playlistName.trim()) return;
    
    let coverData: string | null = null;
    
    // 如果有选择封面，转换为Base64
    if (coverFile) {
      try {
        coverData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Failed to convert image'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(coverFile);
        });
      } catch (error) {
        console.error('封面图片处理失败:', error);
        // 如果转换失败，使用null
        coverData = null;
      }
    }
    
    onCreate(playlistName.trim(), playlistDesc.trim(), coverData);
    onClose();
  };

  return (
    <dialog ref={modalRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-lg w-full">
        <h3 className="font-bold text-lg mb-4">创建新歌单</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 歌单封面 */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">歌单封面</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-20 h-20 rounded-lg overflow-hidden border border-base-300">
                  <img 
                    src={coverPreview} 
                    alt="歌单封面预览" 
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/icon.png";
                    }}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="file-input file-input-sm file-input-bordered w-full max-w-xs"
                  accept="image/*"
                  onChange={handleCoverChange}
                />
                <div className="text-xs text-base-content/70">
                  {coverFile ? (
                    <div className="flex justify-between">
                      <span className="truncate max-w-[150px]">{coverFile.name}</span>
                      <button 
                        type="button" 
                        className="text-error hover:underline" 
                        onClick={handleRemoveCover}
                      >
                        移除
                      </button>
                    </div>
                  ) : (
                    <span>未选择文件 (将使用默认封面)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 歌单名称 */}
          <div className="form-control w-full">
            <div className="join w-full">
              <span className="join-item px-4 mr-[2px] bg-base-100 border border-base-300 rounded-l-lg text-base-content flex items-center justify-center min-w-24">歌单名称</span>
              <input
                ref={nameInputRef}
                type="text"
                placeholder="请输入歌单名称"
                className="join-item input input-bordered border-l-0 rounded-r-lg w-full"
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                required
                maxLength={50}
              />
            </div>
          </div>
          
          {/* 歌单描述 */}
          <div className="form-control w-full">
            <div className="join w-full">
              <span className="join-item px-4 mr-[2px] bg-base-100 border border-base-300 rounded-l-lg text-base-content flex items-center justify-center min-w-24">歌单描述 (可选)</span>
              <textarea
                className="join-item textarea textarea-bordered border-l-0 rounded-r-lg h-24 w-full"
                placeholder="请输入歌单描述"
                value={playlistDesc}
                onChange={(e) => setPlaylistDesc(e.target.value)}
                maxLength={200}
              ></textarea>
            </div>
          </div>
          
          <div className="modal-action">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
            >
              取消
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={!playlistName.trim()}
            >
              创建
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>关闭</button>
      </form>
    </dialog>
  );
};

export default CreatePlaylistModal;