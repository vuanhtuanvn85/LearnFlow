import { useState } from 'react';

function isValidUrl(str) {
  try { return Boolean(new URL(str)); } catch { return false; }
}

export default function SubmitBlock({ block, onSubmitted, submitted }) {
  const label = block?.label || 'Nộp bài thực hành';
  const hint = block?.hint || '';

  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!isValidUrl(trimmed)) {
      setError('Link không hợp lệ. Vui lòng nhập URL đầy đủ (bắt đầu bằng http:// hoặc https://).');
      return;
    }
    setError('');
    onSubmitted(trimmed);
  };

  if (submitted) {
    return (
      <div style={{
        background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 10, padding: '14px 16px', marginBottom: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ color: 'var(--green)', fontSize: 18 }}>✓</span>
        <div>
          <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>{label} — Đã nộp</div>
          <a
            href={submitted} target="_blank" rel="noreferrer"
            style={{ fontSize: 12, color: 'var(--text-muted)', wordBreak: 'break-all' }}
          >
            {submitted}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: 16, marginBottom: 12,
    }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: hint ? 4 : 10, color: 'var(--text)' }}>
        {label}
      </div>
      {hint && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
          {hint}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="url"
          value={value}
          onChange={e => { setValue(e.target.value); setError(''); }}
          placeholder="https://github.com/... hoặc link bài nộp"
          style={{
            flex: 1, background: 'var(--bg3)', border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
            borderRadius: 6, padding: '8px 12px', color: 'var(--text)',
            fontSize: 13, outline: 'none',
          }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          style={{
            background: value.trim() ? 'var(--accent)' : 'var(--bg3)',
            border: '1px solid var(--border)', color: value.trim() ? '#fff' : 'var(--text-muted)',
            borderRadius: 6, padding: '8px 16px', cursor: value.trim() ? 'pointer' : 'default',
            fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
          }}
        >
          Nộp bài
        </button>
      </div>
      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red)' }}>{error}</div>
      )}
    </div>
  );
}
