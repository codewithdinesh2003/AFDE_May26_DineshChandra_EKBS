import React from 'react'

export default function ArticleEditor({ value, onChange, placeholder = 'Write your article content here...' }) {
  const insertFormat = (prefix, suffix = '') => {
    const textarea = document.getElementById('article-editor-textarea')
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)
    const newValue = value.slice(0, start) + prefix + selected + suffix + value.slice(end)
    onChange(newValue)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  return (
    <div style={{ border: '1px solid var(--grey-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
      <div style={{ background: 'var(--grey)', padding: '6px 10px', display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid var(--grey-border)' }}>
        {[
          { label: 'H1', action: () => insertFormat('# ') },
          { label: 'H2', action: () => insertFormat('## ') },
          { label: 'H3', action: () => insertFormat('### ') },
          { label: 'B', action: () => insertFormat('**', '**') },
          { label: 'I', action: () => insertFormat('_', '_') },
          { label: '• List', action: () => insertFormat('- ') },
          { label: '1. List', action: () => insertFormat('1. ') },
          { label: 'Code', action: () => insertFormat('`', '`') },
          { label: 'Table', action: () => insertFormat('| Col1 | Col2 |\n|------|------|\n| Val1 | Val2 |\n') },
        ].map(btn => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            style={{
              padding: '3px 8px',
              fontSize: 12,
              border: '1px solid var(--grey-border)',
              borderRadius: 3,
              background: 'white',
              cursor: 'pointer',
              fontWeight: btn.label === 'B' ? 700 : 400,
              fontStyle: btn.label === 'I' ? 'italic' : 'normal',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>
      <textarea
        id="article-editor-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight: '400px',
          padding: '16px',
          border: 'none',
          outline: 'none',
          fontFamily: 'monospace',
          fontSize: 14,
          lineHeight: 1.7,
          resize: 'vertical',
        }}
      />
      <div style={{ background: 'var(--grey)', padding: '4px 10px', fontSize: 11, color: 'var(--text-light)', borderTop: '1px solid var(--grey-border)' }}>
        Markdown supported · {value ? value.length : 0} characters
      </div>
    </div>
  )
}
