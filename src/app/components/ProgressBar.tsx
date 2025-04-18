import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  // isPlaying prop is removed as it's not directly used for styling here anymore
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localCurrentTime, setLocalCurrentTime] = useState(currentTime); // Local state for smoother dragging
  const containerRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const hoverTimeRef = useRef<HTMLSpanElement>(null); // Ref for hover time tooltip

  // Update local time when external currentTime changes and not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalCurrentTime(currentTime);
    }
  }, [currentTime, isDragging]);

  // Format time display
  const formatTime = useCallback((seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage based on local time for smoother UI during drag
  const calculatePercent = useCallback((): number => {
    if (isNaN(duration) || duration === 0) return 0;
    return Math.min(100, Math.max(0, (localCurrentTime / duration) * 100));
  }, [localCurrentTime, duration]);

  // Handle mouse down on the range input (or track)
  const handleMouseDown = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    if (!duration || isNaN(duration) || !containerRef.current) return;
    setIsDragging(true);
    updateSeekTime(e.nativeEvent); // Update time immediately on click
  };

  // Update seek time based on mouse/touch position
  const updateSeekTime = useCallback((event: MouseEvent | TouchEvent) => {
    if (!containerRef.current || !duration) return;

    const rect = containerRef.current.getBoundingClientRect();
    let clientX: number;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
    } else if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
    } else {
      return; // No position info
    }

    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const seekTime = pos * duration;
    setLocalCurrentTime(seekTime); // Update local state immediately
    // Only call onSeek when dragging stops (in handleMouseUp) or on initial click
    // This prevents flooding the parent component with updates during drag
  }, [duration]);

  // Handle mouse move during drag
  const handleMouseMoveDuringDrag = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging || !duration) return;
    updateSeekTime(event);
  }, [isDragging, duration, updateSeekTime]); // Add updateSeekTime dependency

  // Handle mouse up after drag
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      // Finalize the seek operation by calling the prop function
      if (!isNaN(localCurrentTime)) {
        onSeek(localCurrentTime);
      }
    }
  }, [isDragging, localCurrentTime, onSeek]); // Add dependencies

  // Add and remove global listeners for drag events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMoveDuringDrag);
      document.addEventListener('touchmove', handleMouseMoveDuringDrag);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMoveDuringDrag);
      document.removeEventListener('touchmove', handleMouseMoveDuringDrag);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMoveDuringDrag, handleMouseUp]); // Add dependencies

  // Handle mouse move for hover time display
  const handleMouseMoveHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || !containerRef.current || !duration || isNaN(duration) || !hoverTimeRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = pos * duration;

    // Update hover time tooltip position and content
    hoverTimeRef.current.style.left = `${pos * 100}%`;
    hoverTimeRef.current.textContent = formatTime(time);
    hoverTimeRef.current.classList.remove('opacity-0'); // Make visible
  };

  // Handle mouse leave to hide hover time
  const handleMouseLeave = () => {
    if (hoverTimeRef.current) {
      hoverTimeRef.current.classList.add('opacity-0'); // Hide
    }
  };

  const progressPercent = calculatePercent();

  return (
    <div className="flex items-center w-full gap-3 px-4">
      {/* Current Time */}
      <span className="text-xs text-base-content/70 w-10 text-right tabular-nums font-medium shrink-0">
        {formatTime(localCurrentTime)}
      </span>

      {/* Progress Bar Area */}
      <div
        ref={containerRef}
        className="progress-bar-container group relative flex-1 h-5 flex items-center cursor-pointer" // Increased height for easier interaction
        onMouseMove={handleMouseMoveHover}
        onMouseLeave={handleMouseLeave}
        // Add touch events if needed for hover-like behavior on touch devices
      >
        {/* Invisible Range Input (covers the whole area for interaction) */}
        <input
          ref={rangeRef}
          type="range"
          min="0"
          max="100"
          step="any" // Allow finer control if needed
          value={progressPercent} // Controlled by percentage
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onChange={(e) => {
            // This onChange might be redundant if mouse/touch move handles updates,
            // but can serve as a fallback or for keyboard interaction.
            // If keeping, ensure it updates localCurrentTime and potentially calls onSeek.
            const percent = Number(e.target.value);
            const seekTime = (percent / 100) * duration;
            setLocalCurrentTime(seekTime);
            // Decide if onSeek should be called here or only on mouseUp
            // onSeek(seekTime);
          }}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0 p-0" // Higher z-index
          aria-label="Seek progress"
        />

        {/* Track Background */}
        <div className="absolute w-full h-1.5 bg-base-content/20 rounded-full top-1/2 -translate-y-1/2 pointer-events-none z-0"></div>

        {/* Progress Fill */}
        <div
          className="absolute h-1.5 bg-primary rounded-full top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-all duration-100 ease-linear" // Smooth transition for non-drag updates
          style={{ width: `${progressPercent}%` }}
        ></div>

        {/* Thumb (visible dot) */}
        <div
          className={`absolute w-3.5 h-3.5 bg-primary rounded-full top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10 shadow-md 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-in-out
                     ${isDragging ? '!opacity-100' : ''}`} // Always visible when dragging
          style={{ left: `${progressPercent}%` }}
        ></div>

        {/* Hover Time Tooltip */}
        <span
          ref={hoverTimeRef}
          className="absolute bottom-full mb-2 left-0 -translate-x-1/2 px-2 py-1 bg-base-300 text-base-content text-xs rounded shadow-lg opacity-0 pointer-events-none transition-opacity duration-150 ease-in-out z-30 whitespace-nowrap"
        >
          00:00
        </span>
      </div>

      {/* Duration */}
      <span className="text-xs text-base-content/70 w-10 text-left tabular-nums font-medium shrink-0">
        {formatTime(duration)}
      </span>
    </div>
  );
};

export default ProgressBar;