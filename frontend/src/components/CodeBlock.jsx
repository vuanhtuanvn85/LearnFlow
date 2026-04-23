import { useEffect, useRef, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);

export default function CodeBlock({ block }) {
  const codeRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (codeRef.current) {
      hljs.highlightElement(codeRef.current);
    }
  }, [block.code]);

  const handleCopy = () => {
    navigator.clipboard.writeText(block.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      position: 'relative',
      background: '#0d1117',
      border: '1px solid var(--border)',
      borderRadius: 8,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 14px', background: 'var(--bg3)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono, monospace' }}>
          {block.lang || 'code'}
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: copied ? 'var(--green)' : 'var(--text-muted)',
            borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 12,
          }}
        >
          {copied ? '✓ Đã copy' : 'Copy'}
        </button>
      </div>
      <pre style={{ margin: 0, padding: '14px', overflowX: 'auto' }}>
        <code
          ref={codeRef}
          className={`language-${block.lang || 'text'}`}
          style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 13, lineHeight: 1.6 }}
        >
          {block.code}
        </code>
      </pre>
    </div>
  );
}
