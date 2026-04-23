import { useState, useRef, useCallback, useEffect } from 'react';
import { formatTime } from '../hooks/useAudio';

function imgSrcOf(folder, n) {
  return `/learnflow/${folder}/images/slide-${n}.png`;
}
function audSrcOf(folder, n) {
  return `/learnflow/${folder}/audio/slide_${n}.mp3`;
}

async function probeSlideCount(folder, maxSlides = 60) {
  let count = 0;
  for (let i = 1; i <= maxSlides; i++) {
    const ok = await new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = imgSrcOf(folder, i);
    });
    if (!ok) break;
    count = i;
  }
  return count;
}

function preloadSlide(folder, n) {
  const img = new Image();
  img.src = imgSrcOf(folder, n);
  const a = new Audio();
  a.preload = 'metadata';
  a.src = audSrcOf(folder, n);
}

const SPIN = `@keyframes ss-spin{to{transform:rotate(360deg)}}`;

export default function SlideshowBlock({ block, onEnded }) {
  const { folder, title, slides: staticSlides } = block;

  const [totalSlides, setTotalSlides] = useState(staticSlides?.length || 0);
  const [probing, setProbing]         = useState(!staticSlides?.length);
  const [index, setIndex]             = useState(0);
  const [playing, setPlaying]         = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]       = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [countdown, setCountdown]     = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  const wrapperRef    = useRef(null);
  const audioRef      = useRef(null);
  const countdownRef  = useRef(null);
  const rafRef        = useRef(null);
  const hideTimerRef  = useRef(null);

  // ── Probe ─────────────────────────────────────────────────
  useEffect(() => {
    if (staticSlides?.length) { setTotalSlides(staticSlides.length); setProbing(false); return; }
    if (!folder) return;
    setProbing(true);
    probeSlideCount(folder).then(n => { setTotalSlides(n); setProbing(false); });
  }, [folder, staticSlides]);

  const slideN  = index + 1;
  const imgSrc  = imgSrcOf(folder, slideN);
  const audSrc  = audSrcOf(folder, slideN);
  const progress = duration > 0 ? currentTime / duration : 0;

  // ── Reset khi đổi slide ───────────────────────────────────
  useEffect(() => {
    setPlaying(false); setCurrentTime(0); setDuration(0);
    setCountdown(null);
    clearInterval(countdownRef.current);
    cancelAnimationFrame(rafRef.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    // Ảnh đã preload vào cache — hiện ngay và play audio luôn
    setImageLoaded(true);
    // Delay nhỏ để audio element kịp load src mới
    setTimeout(() => {
      audioRef.current?.play().catch(() => {});
    }, 50);
  }, [index, folder]);

  // ── Autoscroll ────────────────────────────────────────────
  const startAutoscroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const tick = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused || audio.ended) return;
      // Trong fullscreen: scroll wrapper; ngoài: không scroll (fit mode)
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopAutoscroll = useCallback(() => cancelAnimationFrame(rafRef.current), []);

  // ── Countdown ─────────────────────────────────────────────
  const cancelCountdown = useCallback(() => {
    clearInterval(countdownRef.current); setCountdown(null);
  }, []);

  const startCountdown = useCallback((onDone) => {
    setCountdown(3); let n = 3;
    countdownRef.current = setInterval(() => {
      n--;
      if (n <= 0) { clearInterval(countdownRef.current); setCountdown(null); onDone(); }
      else setCountdown(n);
    }, 1000);
  }, []);

  // ── Navigation ────────────────────────────────────────────
  const goNext = useCallback(() => {
    cancelCountdown();
    if (index < totalSlides - 1) {
      setIndex(i => i + 1);
      if (index + 2 <= totalSlides) preloadSlide(folder, index + 2);
      if (index + 3 <= totalSlides) preloadSlide(folder, index + 3);
      if (index + 4 <= totalSlides) preloadSlide(folder, index + 4);
    } else { onEnded?.(); }
  }, [index, totalSlides, folder, onEnded, cancelCountdown]);

  const goPrev = useCallback(() => {
    cancelCountdown();
    if (index > 0) setIndex(i => i - 1);
  }, [index, cancelCountdown]);

  // ── Audio events ──────────────────────────────────────────
  const handlePlay     = useCallback(() => { setPlaying(true);  startAutoscroll(); }, [startAutoscroll]);
  const handlePause    = useCallback(() => { setPlaying(false); stopAutoscroll(); },  [stopAutoscroll]);
  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current; if (!el) return;
    setCurrentTime(el.currentTime);
    if (el.duration && !isNaN(el.duration)) setDuration(el.duration);
  }, []);
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current?.duration) setDuration(audioRef.current.duration);
  }, []);
  const handleEnded = useCallback(() => {
    setPlaying(false); stopAutoscroll(); goNext();
  }, [stopAutoscroll, goNext]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
  }, [playing]);

  const handleSeek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    if (audioRef.current) audioRef.current.currentTime = ratio * (audioRef.current.duration || 0);
    cancelCountdown();
  }, [cancelCountdown]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    // Play chỉ khi audio chưa chạy (trường hợp ảnh chưa được cache)
    if (audioRef.current?.paused) {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  // ── Preload next ──────────────────────────────────────────
  useEffect(() => {
    if (!folder || !totalSlides) return;
    if (slideN + 1 <= totalSlides) preloadSlide(folder, slideN + 1);
    if (slideN + 2 <= totalSlides) preloadSlide(folder, slideN + 2);
    if (slideN + 3 <= totalSlides) preloadSlide(folder, slideN + 3);
  }, [folder, slideN, totalSlides]);

  // ── Fullscreen ────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Auto-hide controls trong fullscreen
  const showControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimerRef.current);
    if (isFullscreen) {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) { setControlsVisible(true); clearTimeout(hideTimerRef.current); }
    else showControls();
  }, [isFullscreen, showControls]);

  // ── Loading states ────────────────────────────────────────
  if (probing) return (
    <div style={stateBox}>
      <style>{SPIN}</style>
      <div style={spinner} /> Đang đọc thư mục "{folder}"...
    </div>
  );

  if (totalSlides === 0) return (
    <div style={{ ...stateBox, flexDirection: 'column', gap: 4 }}>
      Không tìm thấy slides trong "{folder}".<br />
      <span style={{ fontSize: 11 }}>Đặt tên: slide-1.png, slide-2.png... / slide_1.mp3...</span>
    </div>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      onMouseMove={showControls}
      onTouchStart={showControls}
      style={{
        background: '#050810',
        border: '1px solid var(--border)',
        borderRadius: isFullscreen ? 0 : 10,
        overflow: 'hidden',
        marginBottom: 12,
        display: 'flex',
        flexDirection: 'column',
        // Trong fullscreen: chiếm toàn màn hình
        ...(isFullscreen ? { position: 'fixed', inset: 0, zIndex: 9999, marginBottom: 0 } : {}),
      }}
    >
      <style>{SPIN}</style>

      {/* ── Image (fit, không scroll) ── */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Normal: chiều cao = 56.25% width (16:9), min 240px
        ...(isFullscreen
          ? { height: '100%' }
          : { aspectRatio: '16/9', minHeight: 220, maxHeight: 480 }),
        background: '#050810',
        overflow: 'hidden',
      }}>
        <img
          key={imgSrc}
          src={imgSrc}
          alt={`${title || folder} — slide ${slideN}`}
          style={{
            maxWidth: '100%', maxHeight: '100%',
            width: 'auto', height: 'auto',
            display: imageLoaded ? 'block' : 'none',
            objectFit: 'contain',
          }}
          onLoad={handleImageLoad}
          onError={() => setImageLoaded(true)}
        />

        {/* Loading spinner */}
        {!imageLoaded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13 }}>
            <div style={spinner} /> Đang tải slide {slideN}...
          </div>
        )}

        {/* Badge n/total */}
        <div style={{
          position: 'absolute', top: 8, left: 12,
          background: 'rgba(0,0,0,0.55)', borderRadius: 20,
          padding: '2px 10px', fontSize: 12, color: '#cbd5e1',
          pointerEvents: 'none',
        }}>
          {slideN} / {totalSlides}
        </div>

        {/* Fullscreen button — luôn hiện ở góc phải trên */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: 6,
            color: '#fff', cursor: 'pointer', padding: '4px 8px', fontSize: 14,
            lineHeight: 1,
          }}
        >
          {isFullscreen ? '⛶' : '⛶'}
          <span style={{ fontSize: 11, marginLeft: 4 }}>{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
        </button>

        {/* Arrow prev */}
        {index > 0 && (
          <button onClick={goPrev} style={arrowBtn('left')}>‹</button>
        )}
        {/* Arrow next */}
        {index < totalSlides - 1 && (
          <button onClick={() => { cancelCountdown(); goNext(); }} style={arrowBtn('right')}>›</button>
        )}
      </div>

      {/* ── Controls bar ── */}
      <div style={{
        background: isFullscreen ? 'rgba(5,8,16,0.92)' : 'var(--bg3)',
        borderTop: '1px solid var(--border)',
        padding: '8px 12px 10px',
        transition: 'opacity 0.3s',
        opacity: isFullscreen && !controlsVisible ? 0 : 1,
        pointerEvents: isFullscreen && !controlsVisible ? 'none' : 'auto',
        flexShrink: 0,
      }}>
        <audio
          ref={audioRef} src={audSrc} preload="auto"
          onPlay={handlePlay} onPause={handlePause}
          onTimeUpdate={handleTimeUpdate} onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />

        {/* Progress dots (chỉ hiện khi ≤ 30 slides) */}
        {totalSlides > 1 && totalSlides <= 30 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 8 }}>
            {Array.from({ length: totalSlides }, (_, i) => (
              <button key={i} onClick={() => { cancelCountdown(); setIndex(i); }} style={{
                width: i === index ? 18 : 7, height: 7,
                borderRadius: 4, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
                background: i === index ? 'var(--accent)' : 'var(--border)',
                transition: 'width 0.2s, background 0.2s',
              }} />
            ))}
          </div>
        )}

        {/* Seek bar */}
        <div onClick={handleSeek} style={{
          width: '100%', height: 4, background: 'var(--border)',
          borderRadius: 2, cursor: 'pointer', position: 'relative', marginBottom: 8,
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${progress * 100}%`,
            background: 'var(--accent)', borderRadius: 2, transition: 'width 0.1s',
          }} />
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={goPrev} disabled={index === 0} style={iconBtn(index === 0)} title="Slide trước">⏮</button>

          <button onClick={togglePlay} style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'var(--accent)', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 15, flexShrink: 0,
          }}>
            {playing ? '⏸' : '▶'}
          </button>

          <button onClick={() => { cancelCountdown(); goNext(); }} style={iconBtn(false)} title="Slide tiếp">⏭</button>

          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36 }}>
            {formatTime(currentTime)}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Countdown */}
        {countdown !== null && (
          <div style={{
            marginTop: 6, padding: '5px 10px', background: 'var(--bg2)',
            borderRadius: 6, fontSize: 12, color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span>
              {index < totalSlides - 1
                ? `Slide tiếp theo sau ${countdown}s...`
                : `Bài tiếp theo sau ${countdown}s...`}
            </span>
            <button onClick={cancelCountdown} style={{
              background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12,
            }}>Hủy</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────

const stateBox = {
  background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: 10, padding: 28, marginBottom: 12,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: 10, color: 'var(--text-muted)', fontSize: 13,
};

const spinner = {
  width: 18, height: 18,
  border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
  borderRadius: '50%', animation: 'ss-spin 0.8s linear infinite', flexShrink: 0,
};

function arrowBtn(side) {
  return {
    position: 'absolute', [side]: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
    width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
}

function iconBtn(disabled) {
  return {
    background: 'none', border: '1px solid var(--border)',
    color: disabled ? 'var(--border)' : 'var(--text-muted)',
    borderRadius: 6, width: 30, height: 30,
    cursor: disabled ? 'default' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, flexShrink: 0,
  };
}
