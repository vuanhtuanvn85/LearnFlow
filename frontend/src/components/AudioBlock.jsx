import { useAudio, formatTime } from '../hooks/useAudio';

export default function AudioBlock({ block, onEnded }) {
  const {
    audioRef, src, playing, progress, currentTime, duration,
    countdown, togglePlay, seek, handleTimeUpdate, handleLoadedMetadata, handleEnded,
  } = useAudio({
    audioFile: block.audioFile,
    audioDuration: block.audioDuration,
    autoNext: block.autoNext,
    onEnded,
  });

  const handleSeekClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(Math.max(0, Math.min(1, ratio)));
  };

  return (
    <div style={{
      background: 'var(--bg3)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* Image */}
      {block.imageFile && (
        <div style={{ position: 'relative' }}>
          <img
            src={`/images/${block.imageFile}`}
            alt={block.imageLabel || ''}
            style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          {block.imageLabel && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
              padding: '24px 14px 10px',
              fontSize: 13, color: '#cbd5e1',
            }}>
              {block.imageLabel}
            </div>
          )}
        </div>
      )}

      {/* Audio player */}
      {src && (
        <div style={{ padding: '12px 14px' }}>
          <audio
            ref={audioRef}
            src={src}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            preload="metadata"
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Play/Pause button */}
            <button
              onClick={togglePlay}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--accent)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: '#fff', fontSize: 14,
              }}
            >
              {playing ? '⏸' : '▶'}
            </button>

            {/* Time */}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 38 }}>
              {formatTime(currentTime)}
            </span>

            {/* Progress bar */}
            <div
              onClick={handleSeekClick}
              style={{
                flex: 1, height: 4, background: 'var(--border)',
                borderRadius: 2, cursor: 'pointer', position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${progress * 100}%`,
                background: 'var(--accent)', borderRadius: 2,
                transition: 'width 0.1s',
              }} />
            </div>

            {/* Duration */}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 38, textAlign: 'right' }}>
              {formatTime(duration)}
            </span>
          </div>

          {/* AutoNext countdown */}
          {countdown !== null && (
            <div style={{
              marginTop: 8, padding: '6px 10px', background: 'var(--bg2)',
              borderRadius: 6, fontSize: 12, color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Chuyển sang bài tiếp theo sau {countdown}s...</span>
              <button
                onClick={() => { /* cancelCountdown handled in hook */ }}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12 }}
              >
                Hủy
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
