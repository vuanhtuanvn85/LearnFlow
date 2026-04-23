import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import AudioBlock from './AudioBlock';
import SlideshowBlock from './SlideshowBlock';
import CodeBlock from './CodeBlock';
import QuizBlock from './QuizBlock';
import LinkBlock from './LinkBlock';
import SubmitBlock from './SubmitBlock';

function TextBlock({ block }) {
  return (
    <div style={{ lineHeight: 1.75, color: 'var(--text)', marginBottom: 16, whiteSpace: 'pre-wrap' }}>
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

// Phân tích completion requirement từ lesson
function parseCompletion(completion) {
  if (!completion) return null;
  if (completion === 'submit') return { type: 'submit' };
  const m = completion.match(/^quiz:(\d+)$/);
  if (m) return { type: 'quiz', required: parseInt(m[1]) };
  return null;
}

export default function ContentArea({
  lesson, allLessons, currentIndex,
  onPrev, onNext, onMarkDone, onMarkUndone, done, saved, onToggleSaved,
  quizResults, saveQuizResult,
}) {
  const scrollRef = useRef(null);
  const isDone = lesson ? done.includes(lesson.id) : false;
  const isSaved = lesson ? saved.includes(lesson.id) : false;

  // Quiz: đếm số câu đúng trong bài hiện tại
  const [correctCount, setCorrectCount] = useState(0);
  // Submit: lưu link đã nộp
  const [submitLink, setSubmitLink] = useState('');
  // Track if quiz result was already saved this session
  const [quizSaved, setQuizSaved] = useState(false);

  // Tổng số quiz block trong bài
  const totalQuizCount = useMemo(
    () => (lesson?.blocks ?? []).filter(b => b.type === 'quiz').length,
    [lesson?.id]  // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Reset khi đổi bài
  useEffect(() => {
    setCorrectCount(0);
    setSubmitLink('');
    setQuizSaved(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [lesson?.id]);

  // Lưu điểm khi tất cả quiz đã trả lời đúng đủ số lần
  useEffect(() => {
    if (!saveQuizResult || !lesson || totalQuizCount === 0) return;
    if (quizSaved) return;
    if (correctCount > 0 && correctCount >= totalQuizCount) {
      setQuizSaved(true);
      saveQuizResult(lesson.id, correctCount, totalQuizCount);
    }
  }, [correctCount, totalQuizCount, lesson?.id, quizSaved, saveQuizResult]);

  const completion = lesson ? parseCompletion(lesson.completion) : null;

  // Tính xem bài đã đủ điều kiện để Tiếp chưa
  const isUnlocked = (() => {
    if (isDone) return true; // đã học rồi thì luôn unlock
    if (!completion) return true; // không có ràng buộc
    if (completion.type === 'quiz') return correctCount >= completion.required;
    if (completion.type === 'submit') return submitLink.length > 0;
    return true;
  })();

  const handleCorrect = useCallback(() => {
    setCorrectCount(c => c + 1);
  }, []);

  const handleSubmitted = useCallback((link) => {
    setSubmitLink(link);
  }, []);

  const handleAutoNext = useCallback(() => {
    if (currentIndex < allLessons.length - 1) onNext();
  }, [currentIndex, allLessons.length, onNext]);

  // Nút Tiếp = mark done + next
  const handleNext = useCallback(() => {
    if (!isUnlocked) return;
    onMarkDone(lesson.id);
    onNext();
  }, [isUnlocked, lesson, onMarkDone, onNext]);

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

  // Thông báo điều kiện còn thiếu
  const lockHint = (() => {
    if (isUnlocked) return null;
    if (completion?.type === 'quiz') {
      const remaining = completion.required - correctCount;
      return `Cần trả lời đúng thêm ${remaining} câu để tiếp tục`;
    }
    if (completion?.type === 'submit') return 'Nộp link bài thực hành để tiếp tục';
    return null;
  })();

  const isLastLesson = currentIndex === allLessons.length - 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{lesson.type}</div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{lesson.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Badge điểm quiz */}
          {quizResults?.[lesson.id] && (
            <span style={{
              fontSize: 12, color: 'var(--amber)',
              background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 6, padding: '4px 10px',
            }}>
              Điểm: {quizResults[lesson.id].score}/10
            </span>
          )}
          {/* Badge đã học — click để đánh dấu chưa học */}
          {isDone && (
            <button
              onClick={() => onMarkUndone(lesson.id)}
              title="Đánh dấu chưa học"
              style={{
                fontSize: 12, color: 'var(--green)',
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              }}
            >
              ✓ Đã học
            </button>
          )}
          {/* Lưu bài */}
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
          if (block.type === 'slideshow') return (
            <SlideshowBlock key={i} block={block} onEnded={block.autoNext ? handleAutoNext : undefined} />
          );
          if (block.type === 'image') return <ImageBlock key={i} block={block} />;
          if (block.type === 'code') return <CodeBlock key={i} block={block} />;
          if (block.type === 'quiz') return (
            <QuizBlock key={i} block={block} onCorrect={handleCorrect} />
          );
          if (block.type === 'link') return <LinkBlock key={i} block={block} />;
          if (block.type === 'submit') return (
            <SubmitBlock key={i} block={block} onSubmitted={handleSubmitted} submitted={submitLink} />
          );
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
        padding: '12px 20px', borderTop: '1px solid var(--border)',
        background: 'var(--bg2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0, gap: 12,
      }}>
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: currentIndex === 0 ? 'var(--text-muted)' : 'var(--text)',
            borderRadius: 6, padding: '8px 16px',
            cursor: currentIndex === 0 ? 'default' : 'pointer', fontSize: 13,
          }}
        >
          ← Trước
        </button>

        {/* Lock hint */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          {lockHint && !isDone ? (
            <span style={{ fontSize: 12, color: 'var(--amber)' }}>🔒 {lockHint}</span>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {currentIndex + 1} / {allLessons.length}
            </span>
          )}
        </div>

        {isLastLesson ? (
          /* Bài cuối: chỉ mark done, không next */
          <button
            onClick={() => onMarkDone(lesson.id)}
            disabled={isDone}
            style={{
              background: isDone ? 'rgba(34,197,94,0.15)' : 'var(--green)',
              border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : 'var(--green)'}`,
              color: isDone ? 'var(--green)' : '#fff',
              borderRadius: 6, padding: '8px 16px',
              cursor: isDone ? 'default' : 'pointer', fontSize: 13, fontWeight: 500,
            }}
          >
            {isDone ? '✓ Đã hoàn thành' : 'Hoàn thành'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!isUnlocked}
            title={!isUnlocked ? lockHint : ''}
            style={{
              background: isUnlocked ? 'var(--accent)' : 'var(--bg3)',
              border: `1px solid ${isUnlocked ? 'var(--accent)' : 'var(--border)'}`,
              color: isUnlocked ? '#fff' : 'var(--text-muted)',
              borderRadius: 6, padding: '8px 16px',
              cursor: isUnlocked ? 'pointer' : 'not-allowed',
              fontSize: 13, fontWeight: 500,
              opacity: isUnlocked ? 1 : 0.6,
            }}
          >
            {isDone ? 'Tiếp →' : 'Tiếp →'}
          </button>
        )}
      </div>
    </div>
  );
}
