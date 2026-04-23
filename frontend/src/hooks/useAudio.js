import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudio({ audioFile, audioDuration, autoNext, onEnded }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // 0–1
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(audioDuration || 0);
  const [countdown, setCountdown] = useState(null); // null | number
  const countdownRef = useRef(null);

  // Reset when audioFile changes
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setCountdown(null);
    clearInterval(countdownRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [audioFile]);

  const startCountdown = useCallback(() => {
    if (!autoNext || !onEnded) return;
    setCountdown(3);
    let n = 3;
    countdownRef.current = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(countdownRef.current);
        setCountdown(null);
        onEnded();
      } else {
        setCountdown(n);
      }
    }, 1000);
  }, [autoNext, onEnded]);

  const cancelCountdown = useCallback(() => {
    clearInterval(countdownRef.current);
    setCountdown(null);
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      cancelCountdown();
    } else {
      audioRef.current.play();
    }
    setPlaying(p => !p);
  }, [playing, cancelCountdown]);

  const seek = useCallback((ratio) => {
    if (!audioRef.current) return;
    const dur = audioRef.current.duration || duration;
    audioRef.current.currentTime = ratio * dur;
    setProgress(ratio);
    cancelCountdown();
  }, [duration, cancelCountdown]);

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const dur = el.duration || duration;
    setCurrentTime(el.currentTime);
    setProgress(dur > 0 ? el.currentTime / dur : 0);
  }, [duration]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    setProgress(1);
    startCountdown();
  }, [startCountdown]);

  const src = audioFile ? `/learnflow/audios/${audioFile}` : null;

  return {
    audioRef,
    src,
    playing,
    progress,
    currentTime,
    duration,
    countdown,
    togglePlay,
    seek,
    handleTimeUpdate,
    handleLoadedMetadata,
    handleEnded,
    cancelCountdown,
  };
}

export function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
