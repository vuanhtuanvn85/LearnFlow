import { useState } from 'react';

export default function QuizBlock({ block, onCorrect }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (i) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === block.correct) onCorrect?.();
  };

  const getColor = (i) => {
    if (selected === null) return 'var(--bg3)';
    if (i === block.correct) return 'rgba(34,197,94,0.15)';
    if (i === selected) return 'rgba(239,68,68,0.15)';
    return 'var(--bg3)';
  };

  const getBorder = (i) => {
    if (selected === null) return 'var(--border)';
    if (i === block.correct) return 'var(--green)';
    if (i === selected) return 'var(--red)';
    return 'var(--border)';
  };

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 16, marginBottom: 12,
    }}>
      <p style={{ margin: '0 0 14px', fontWeight: 500, lineHeight: 1.5 }}>
        {block.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {block.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={selected !== null}
            style={{
              background: getColor(i),
              border: `1px solid ${getBorder(i)}`,
              borderRadius: 6, padding: '10px 14px',
              cursor: selected !== null ? 'default' : 'pointer',
              textAlign: 'left', color: 'var(--text)',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'background 0.2s, border-color 0.2s',
            }}
          >
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: selected !== null && i === block.correct ? 'var(--green)'
                : selected === i && i !== block.correct ? 'var(--red)'
                : 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: '#fff', flexShrink: 0, fontWeight: 600,
            }}>
              {selected !== null && i === block.correct ? '✓'
                : selected === i && i !== block.correct ? '✗'
                : String.fromCharCode(65 + i)}
            </span>
            {opt}
          </button>
        ))}
      </div>
      {selected !== null && block.explain && (
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.3)',
          borderRadius: 6, fontSize: 13, color: '#93b4f7', lineHeight: 1.5,
        }}>
          💡 {block.explain}
        </div>
      )}
      {selected !== null && (
        <div style={{
          marginTop: 8, fontSize: 13, fontWeight: 500,
          color: selected === block.correct ? 'var(--green)' : 'var(--red)',
        }}>
          {selected === block.correct ? '✓ Đúng rồi!' : `✗ Sai. Đáp án đúng: ${block.options[block.correct]}`}
        </div>
      )}
    </div>
  );
}
