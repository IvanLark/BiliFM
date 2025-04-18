import React, { useState, useRef } from 'react';
import ThemeSelector from './ThemeSelector';
import { Song, Playlist } from '../../storage/storage.type';
import { toast } from '../utils/toast';

interface SettingsModalProps {
  isOpen: boolean;
  currentTheme: string;
  onClose: () => void;
  onThemeChange: (themeId: string) => void;
  onImportDataSuccess: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  currentTheme,
  onClose,
  onThemeChange,
  onImportDataSuccess
}) => {
  const [currentTab, setCurrentTab] = useState<'general' | 'data'>('general');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;

  // 处理导出数据
  const handleExportData = () => {
    // 获取所有歌曲和歌单
    chrome.runtime.sendMessage(
      { action: 'get_all_songs' },
      (songsResponse) => {
        if (songsResponse && songsResponse.success) {
          const songs = songsResponse.songs as Song[];
          
          chrome.runtime.sendMessage(
            { action: 'get_all_playlists' },
            (playlistsResponse) => {
              if (playlistsResponse && playlistsResponse.success) {
                const playlists = playlistsResponse.playlists as Playlist[];
                
                // 创建导出数据
                const exportData = {
                  songs,
                  playlists
                };
                
                // 转换为 JSON
                const jsonString = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // 创建下载链接
                const downloadLink = document.createElement('a');
                downloadLink.href = url;
                downloadLink.download = `bilifm-export-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                toast.success('数据导出成功');
              } else {
                toast.error(`获取歌单失败: ${playlistsResponse?.error || '未知错误'}`);
              }
            }
          );
        } else {
          toast.error(`获取歌曲失败: ${songsResponse?.error || '未知错误'}`);
        }
      }
    );
  };

  // 处理导入数据
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target?.result as string);
        
        // 验证数据格式
        if (!jsonData.songs || !jsonData.playlists || !Array.isArray(jsonData.songs) || !Array.isArray(jsonData.playlists)) {
          throw new Error('数据格式无效');
        }
        
        // 发送数据到 background 脚本
        chrome.runtime.sendMessage(
          { action: 'import_data', data: jsonData },
          (response) => {
            if (response && response.success) {
              toast.success('数据导入成功');
              onImportDataSuccess(); // 通知父组件数据导入成功
            } else {
              toast.error(`导入失败`);
            }
            setIsImporting(false);
          }
        );
      } catch (error) {
        console.error('导入数据解析错误:', error);
        toast.error(`导入失败: ${error instanceof Error ? error.message : '数据格式错误'}`);
        setIsImporting(false);
      } finally {
        // 重置文件输入，允许选择同一个文件
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    reader.onerror = () => {
      toast.error('读取文件失败');
      setIsImporting(false);
    };
    
    reader.readAsText(file);
  };

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box w-11/12 max-w-md">
        <h3 className="font-bold text-lg mb-4">设置</h3>
        
        {/* 标签页选择器 */}
        <div className="tabs tabs-box mb-6">
          <button 
            className={`tab ${currentTab === 'general' ? 'tab-active' : ''}`} 
            onClick={() => setCurrentTab('general')}
          >
            常规
          </button>
          <button 
            className={`tab ${currentTab === 'data' ? 'tab-active' : ''}`} 
            onClick={() => setCurrentTab('data')}
          >
            数据管理
          </button>
        </div>
        
        {/* 常规设置页 */}
        {currentTab === 'general' && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">主题设置</span>
              </label>
              <ThemeSelector 
                currentTheme={currentTheme} 
                onThemeChange={onThemeChange}
                inSettingsModal={true}  
              />
            </div>
          </div>
        )}
        
        {/* 数据管理页 */}
        {currentTab === 'data' && (
          <div className="space-y-6">
            <div className="card card-border bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-base">导出数据</h2>
                <p className="text-sm opacity-70">导出所有歌曲和歌单数据到 JSON 文件</p>
                <div className="card-actions justify-end mt-2">
                  <button 
                    className="btn btn-primary" 
                    onClick={handleExportData}
                  >
                    导出数据
                  </button>
                </div>
              </div>
            </div>
            
            <div className="card card-border bg-base-200">
              <div className="card-body">
                <h2 className="card-title text-base">导入数据</h2>
                <p className="text-sm opacity-70">从 JSON 文件导入歌曲和歌单数据</p>
                <div className="card-actions justify-end mt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={handleImportClick}
                    disabled={isImporting}
                  >
                    {isImporting ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        正在导入...
                      </>
                    ) : '导入数据'}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="alert alert-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>导入的数据将会在当前数据中追加</span>
            </div>
          </div>
        )}
        
        {/* 模态框底部按钮 */}
        <div className="modal-action">
          <button className="btn" onClick={onClose}>关闭</button>
        </div>
      </div>
      
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>关闭</button>
      </form>
    </dialog>
  );
};

export default SettingsModal;