import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

interface AudioChipProps {
  src: string;
  label: string;
  duration: number;
  className?: string;
}

export function AudioChip({ src, label, duration, className = "" }: AudioChipProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Pause any other audio elements that might be playing
      const allAudioElements = document.querySelectorAll('audio');
      allAudioElements.forEach(audio => {
        if (audio !== audioRef.current) {
          audio.pause();
        }
      });
      
      audioRef.current.play();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      togglePlayback();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, []);

  // Simple waveform visualization
  const renderWaveform = () => {
    const bars = 12;
    const progress = audioRef.current ? currentTime / duration : 0;
    
    return (
      <div className="flex items-center space-x-0.5 mx-2">
        {Array.from({ length: bars }).map((_, i) => {
          const isActive = isPlaying && (i / bars) < progress;
          const height = Math.random() * 8 + 4; // Random heights between 4-12px
          
          return (
            <div
              key={i}
              className={`w-0.5 rounded-sm transition-colors duration-150 ${
                isActive ? 'bg-blue-500' : 'bg-gray-300'
              }`}
              style={{ height: `${height}px` }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        onClick={togglePlayback}
        onKeyDown={handleKeyDown}
        className="flex items-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={isPlaying ? 'Pause audio sample' : 'Play audio sample'}
        data-testid="button-audio-play"
      >
        {isPlaying ? (
          <Pause size={20} className="text-white" />
        ) : (
          <Play size={20} className="text-white" />
        )}
        
        <span>{label}</span>
        
        {isPlaying && renderWaveform()}
        
        <span className="text-blue-100 text-sm ml-3">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </button>
      
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        aria-hidden="true"
      />
    </div>
  );
}