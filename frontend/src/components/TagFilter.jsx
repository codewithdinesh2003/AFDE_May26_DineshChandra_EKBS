import React from 'react'

export default function TagFilter({ tags, selectedTag, onSelect }) {
  return (
    <div className="sidebar-section">
      <div className="sidebar-title">Tags</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button
          className={`tag${!selectedTag ? '' : ''}`}
          style={{
            cursor: 'pointer',
            background: !selectedTag ? 'var(--primary)' : 'transparent',
            color: !selectedTag ? 'white' : 'var(--primary)',
            border: '1px solid var(--primary)',
          }}
          onClick={() => onSelect(null)}
        >
          All
        </button>
        {tags.map(tag => (
          <button
            key={tag.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              cursor: 'pointer',
              border: '1px solid var(--primary)',
              background: selectedTag === tag.name ? 'var(--primary)' : 'transparent',
              color: selectedTag === tag.name ? 'white' : 'var(--primary)',
            }}
            onClick={() => onSelect(selectedTag === tag.name ? null : tag.name)}
          >
            {tag.name}
          </button>
        ))}
      </div>
    </div>
  )
}
