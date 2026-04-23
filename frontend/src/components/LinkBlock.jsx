const DOMAIN_ICONS = {
  'youtube.com': '▶',
  'youtu.be': '▶',
  'github.com': '',
  'docs.python.org': '📄',
  'nodejs.org': '📄',
  'developer.mozilla.org': '📄',
  'stackoverflow.com': '💬',
};

function getDomainIcon(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return DOMAIN_ICONS[host] || '🔗';
  } catch {
    return '🔗';
  }
}

export default function LinkBlock({ block }) {
  const icon = block.icon || getDomainIcon(block.url);
  return (
    <a
      href={block.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--bg3)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '12px 14px', textDecoration: 'none',
        color: 'var(--text)', marginBottom: 8,
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)';
        e.currentTarget.style.background = 'rgba(79,142,247,0.06)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.background = 'var(--bg3)';
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 500 }}>{block.title}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>↗</span>
    </a>
  );
}
