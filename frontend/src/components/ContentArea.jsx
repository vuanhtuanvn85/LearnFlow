import { useEffect, useRef } from 'react';
import AudioBlock from './AudioBlock';
import CodeBlock from './CodeBlock';
import QuizBlock from './QuizBlock';
import LinkBlock from './LinkBlock';

function TextBlock({ block }) {
  return (
    <div style={{
      lineHeight: 1.75, color: 'var(--text)',
      marginBottom: 16, whiteSpace: 'pre-wrap',
    }}>
      {block.content}
    </div>
  );
}

function ImageBlock({ block }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <img
        src={`/learnflow/images/${block.imageFile}`}
        alt={block.imageLabel || ''}
        style={{ width: '100%', borderRadius: 8, display: 'block' }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      {block.imageLabel && (
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          {block.imageLabel}
        </p>
      )}
    </div>
  );
}

export default function ContentArea({
  lesson, allLessons, currentIndex,
  onPrev, onNext, onMarkDone, done, saved, onToggleSaved,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [lesson?.id]);

  if (!lesson) {
    return (
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text-muted)', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 48 }}>📚</div>
        <div>Chọn một bài học từ sidebar để bắt đầu</div>
      </div>
    );
  }

  const isDone = done.includes(lesson.id);
  const isSaved = saved.includes(lesson.id);

  const handleAutoNext = () => {
    if (currentIndex < allLessons.length - 1) onNext();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Topbar */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>
            {lesson.type}
          </div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>
            {lesson.title}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onToggleSaved(lesson.id)}
            title={isSaved ? 'Bỏ lưu' : 'Lưu lại'}
            style={{
              background: isSaved ? 'rgba(79,142,247,0.15)' : 'var(--bg3)',
              border: `1px solid ${isSaved ? 'var(--accent)' : 'var(--border)'}`,
              color: isSaved ? 'var(--accent)' : 'var(--text-muted)',
              borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13,
            }}
          >
            {isSaved ? '★ Đã lưu' : '☆ Lưu lại'}
          </button>
          <button
            onClick={() => onMarkDone(lesson.id)}
            style={{
              background: isDone ? 'rgba(34,197,94,0.15)' : 'var(--bg3)',
              border: `1px solid ${isDone ? 'var(--green)' : 'var(--border)'}`,
              color: isDone ? 'var(--green)' : 'var(--text-muted)',
              borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 13,
            }}
          >
            {isDone ? '✓ Đã học' : '○ Đánh dấu xong'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {lesson.blocks.length === 0 && (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
            Bài học này chưa có nội dung.
          </div>
        )}
        {lesson.blocks.map((block, i) => {
          if (block.type === 'text') return <TextBlock key={i} block={block} />;
          if (block.type === 'image+audio') return (
            <AudioBlock key={i} block={block} onEnded={block.autoNext ? handleAutoNext : undefined} />
          );
          if (block.type === 'image') return <ImageBlock key={i} block={block} />;
          if (block.type === 'code') return <CodeBlock key={i} block={block} />;
          if (block.type === 'quiz') return <QuizBlock key={i} block={block} />;
          if (block.type === 'link') return <LinkBlock key={i} block={block} />;
          return null;
        })}

        {/* Notes */}
        {lesson.notes && (
          <div style={{
            marginTop: 20, padding: 14,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, fontSize: 13, color: '#fcd34d', lineHeight: 1.6,
          }}>
            📌 {lesson.notes}
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: currentIndex === 0 ? 'var(--text-muted)' : 'var(--text)',
            borderRadius: 6, padding: '8px 16px', cursor: currentIndex === 0 ? 'default' : 'pointer',
            fontSize: 13,
          }}
        >
          ← Trước
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {currentIndex + 1} / {allLessons.length}
        </span>
        <button
          onClick={onNext}
          disabled={currentIndex === allLessons.length - 1}
          style={{
            background: currentIndex < allLessons.length - 1 ? 'var(--accent)' : 'var(--bg3)',
            border: '1px solid var(--border)',
            color: currentIndex < allLessons.length - 1 ? '#fff' : 'var(--text-muted)',
            borderRadius: 6, padding: '8px 16px',
            cursor: currentIndex === allLessons.length - 1 ? 'default' : 'pointer',
            fontSize: 13,
          }}
        >
          Tiếp →
        </button>
      </div>
    </div>
  );
}
