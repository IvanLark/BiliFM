import React, { useEffect, useRef, useState } from 'react';
import { Song } from '../../storage/storage.type';
import ProgressBar from './ProgressBar';
// 导入新的图标和类型
import { faPlay, faPause, faForward, faBackward, faRepeat, faRandom, faListOl, faVolumeUp, faVolumeMute, faDownload } from '@fortawesome/free-solid-svg-icons';
import { faBilibili } from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PlaybackMode } from '../App'; // 导入播放模式类型
import { getPlayUrl } from '../../utils/bilibiliApi';
import { toast } from '../utils/toast';

interface AudioPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackMode: PlaybackMode; // 新增：播放模式
  playbackRate: number; // 新增：播放倍速
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onEnded: () => void;
  onVolumeChange: (volume: number) => void;
  onMuteToggle: () => void;
  onPlaybackModeToggle: () => void; // 新增：切换播放模式
  onPlaybackRateCycle: () => void; // 新增：切换播放倍速
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentSong,
  isPlaying,
  volume,
  isMuted,
  playbackMode, // 使用 playbackMode
  playbackRate, // 使用 playbackRate
  onPlay,
  onPause,
  onNext,
  onPrev,
  onEnded,
  onVolumeChange,
  onMuteToggle,
  onPlaybackModeToggle, // 使用 onPlaybackModeToggle
  onPlaybackRateCycle, // 使用 onPlaybackRateCycle
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const volumeControlRef = useRef<HTMLDivElement>(null);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

  // 监听当前歌曲变化
  useEffect(() => {
    if (currentSong && audioRef.current) {
      // 重置状态
      setCurrentTime(0);
      setAudioDuration(currentSong.duration || 0);
      setIsAudioLoaded(false);

      getPlayUrl(currentSong.bvid, currentSong.cid.toString()).then(({audioUrl}) => {
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.load();
        }
      });
    }
  }, [currentSong]);

  // 控制播放状态 - 修复了异步处理
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handlePlay = async () => {
      if (isPlaying && audioElement.readyState >= 2) {
        try {
          await audioElement.play();
        } catch (error) {
          console.error('播放出错:', error);
          toast.error('播放出错，请重试');
          onPause();
        }
      }
    };

    if (isPlaying) {
      if (audioElement.readyState >= 2) {
        handlePlay();
      } else {
        console.log("音频未加载完成")
        
        // 如果音频还未加载完成，等待加载
        const handleCanPlay = async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          setIsAudioLoaded(true);
          handlePlay();
          audioElement.removeEventListener('canplay', handleCanPlay);
        };
        audioElement.addEventListener('canplay', handleCanPlay);
        return () => {
          audioElement.removeEventListener('canplay', handleCanPlay);
        };
      }
    } else {
      audioElement.pause();
    }
  }, [isPlaying, isAudioLoaded, currentSong, onPause]);

  // 监听音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 监听循环模式变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = playbackMode === 'LOOP';
    }
  }, [playbackMode]);

  // 监听播放倍速变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // 处理点击外部关闭音量控制
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeControlRef.current && 
        !volumeControlRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.volume-button')
      ) {
        setIsVolumeVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 处理时间更新
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!audioDuration && audioRef.current.duration) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  // 处理加载元数据
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
      setIsAudioLoaded(true);
    }
  };

  // 处理播放进度更改
  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // 处理音量点击
  const handleVolumeClick = () => {
    setIsVolumeVisible(!isVolumeVisible);
  };

  // 处理错误
  const handleError = () => {
    toast.error("加载音频失败，请重试");
    onPause();
  };

  // 跳转到B站视频页面
  const jumpToVideo = () => {
    if (currentSong && currentSong.bvid) {
      const url = `https://www.bilibili.com/video/${currentSong.bvid}${currentSong.page > 1 ? `?p=${currentSong.page}` : ''}`;
      window.open(url, '_blank');
    }
  };

  // 监听空格键控制播放/暂停
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 避免在输入框、文本域等表单元素聚焦时触发
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'BUTTON') return;
      if (event.code === 'Space' || event.key === ' ') {
        event.preventDefault();
        if (currentSong) {
          if (isPlaying) {
            onPause();
          } else {
            onPlay();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, currentSong, onPlay, onPause]);

  // --- Helper functions for button display ---
  const getPlaybackModeIcon = () => {
    switch (playbackMode) {
      case 'LOOP': return faRepeat;
      case 'RANDOM': return faRandom;
      case 'ORDER':
      default: return faListOl; // 使用列表图标表示顺序播放
    }
  };

  const getPlaybackModeTitle = () => {
     switch (playbackMode) {
      case 'LOOP': return "切换播放模式: 当前单曲循环";
      case 'RANDOM': return "切换播放模式: 当前随机播放";
      case 'ORDER':
      default: return "切换播放模式: 当前顺序播放";
    }
  };

  const handleDownloadClick = async () => {
    if (!currentSong) return;
    try {
      const { audioUrl } = await getPlayUrl(currentSong.bvid, currentSong.cid.toString());
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSong.title || 'audio'}.mp3`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch {
      toast.error("下载失败，请重试");
    }
  }

  return (
    <footer id="audio-player-bar" className="fixed left-0 right-0 bottom-0 h-[100px] bg-base-100/80 backdrop-blur-md border-t border-base-300 flex items-center px-4 md:px-6 shadow-inner z-50">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onEnded}
        onError={handleError}
        // loop 属性由 useEffect 根据 playbackMode 控制
      />

      {/* 左侧：歌曲信息 */}
      <div id="player-left" className="flex items-start gap-4 w-1/4 min-w-[200px]">
        {currentSong ? (
          <>
            {/* 封面 */}
            <div id="player-cover-container" className="avatar flex-shrink-0"> 
              <div className="w-14 rounded">
                <img 
                  src={currentSong.cover || "/icon.png"} 
                  alt="cover" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/icon.png";
                  }}
                />
              </div>
            </div>
            {/* 标题、艺术家 */}
            <div id="player-info-actions" className="flex flex-col justify-center min-w-0 flex-grow"> 
              <div id="player-song-details" className="flex flex-col gap-1 min-w-0">
                <span className="font-semibold text-sm truncate text-base-content">
                  {currentSong.title}
                </span>
                <span 
                  className="text-xs text-base-content/60 truncate mt-1 link"
                  onClick={() => {
                    window.open(`https://space.bilibili.com/${currentSong.author?.mid}`, '_blank');
                  }}
                >
                  {currentSong.author?.name || "未知艺术家"}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-base-content/60">未选择歌曲</div>
        )}
      </div>

      {/* 中间：控制和进度 */}
      <div id="player-center" className="flex flex-col items-center flex-1 mx-4 min-w-[300px]">
        {/* 控制按钮 */}
        <div id="audio-player-controls" className="flex items-center gap-3 mb-2">
          {/* B站原视频链接 */}
          <button
            className="btn btn-ghost btn-md btn-circle text-pink-500"
            title="跳转到原视频"
            onClick={jumpToVideo}
            disabled={!currentSong}
          >
            <FontAwesomeIcon icon={faBilibili} size="lg" />
          </button>

          {/* 新增：倍速播放按钮 */}
          <button
            className={`btn btn-ghost btn-md btn-circle`}
            onClick={onPlaybackRateCycle} // 调用切换倍速函数
            title={`切换播放速度: 当前 ${playbackRate}x`}
            disabled={!currentSong}
          >
            {/* 直接显示倍速文本 */}
            <span className="text-sm font-bold w-6 text-center">{playbackRate}x</span>
          </button>

          {/* 上一首按钮 */}
          <button
            className="btn btn-ghost btn-md btn-circle audio-btn"
            id="prev-btn"
            title="上一首"
            onClick={onPrev}
            disabled={!currentSong}
          >
            <FontAwesomeIcon icon={faBackward} size="lg" />
          </button>

          {/* 播放/暂停按钮 */}
          <button
            className="btn btn-primary btn-circle audio-btn w-12 h-12 shadow-md"
            id="play-btn"
            title={isPlaying ? "暂停" : "播放"}
            onClick={isPlaying ? onPause : onPlay}
            disabled={!currentSong}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} size="xl" />
          </button>

          {/* 下一首按钮 */}
          <button
            className="btn btn-ghost btn-md btn-circle audio-btn"
            id="next-btn"
            title="下一首"
            onClick={onNext}
            disabled={!currentSong}
          >
            <FontAwesomeIcon icon={faForward} size="lg"/>
          </button>

          {/* 修改：播放模式切换按钮 */}
          <button
            className={`btn btn-ghost btn-md btn-circle`}
            title={getPlaybackModeTitle()}
            onClick={onPlaybackModeToggle} // 调用切换模式函数
            disabled={!currentSong}
          >
            <FontAwesomeIcon icon={getPlaybackModeIcon()} size="lg" />
          </button>

          {/* 下载按钮 */}
          <button
            className="btn btn-ghost btn-md btn-circle"
            title="下载音频"
            disabled={!currentSong}
            onClick={handleDownloadClick}
          >
            <FontAwesomeIcon icon={faDownload} size="lg" />
          </button>
        </div>

        {/* 进度条和时间 */}
        <ProgressBar
          currentTime={currentTime}
          duration={audioDuration}
          onSeek={handleSeek}
        />
      </div>

      {/* 右侧：额外控制 */}
      <div id="player-right" className="flex items-center justify-start gap-3 w-1/4 min-w-[180px]">
        {/* 音量控制 */}
        <div className="volume-control relative">
          <button
            className="volume-button btn btn-ghost btn-md btn-circle"
            onClick={handleVolumeClick}
            title={isMuted ? "取消静音" : "静音"}
          >
            <FontAwesomeIcon icon={isMuted || volume === 0 ? faVolumeMute : faVolumeUp} size="lg" />
          </button>

          {isVolumeVisible && (
            <div
              ref={volumeControlRef}
              className="volume-slider absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 bg-base-300 rounded-lg shadow-lg border border-base-200 w-52"
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="range range-xs range-primary"
              />
              <div className="flex justify-between text-xs mt-1 text-base-content/60">
                <span onClick={() => onVolumeChange(0)}>0</span>
                <span onClick={onMuteToggle}>{isMuted ? "取消静音" : "静音"}</span>
                <span onClick={() => onVolumeChange(1)}>100</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default AudioPlayer;