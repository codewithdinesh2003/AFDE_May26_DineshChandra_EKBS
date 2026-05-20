import React from 'react'

export default function CategorySidebar({ categories, selectedId, onSelect }) {
  return (
    <div className="sidebar-section">
      <div className="sidebar-title">Categories</div>
      <div className="checkbox-group">
        <label className="checkbox-item">
          <input
            type="radio"
            name="category"
            checked={!selectedId}
            onChange={() => onSelect(null)}
          />
          All Categories
        </label>
        {categories.map(cat => (
          <label key={cat.id} className="checkbox-item">
            <input
              type="radio"
              name="category"
              checked={selectedId === cat.id}
              onChange={() => onSelect(cat.id)}
            />
            <span>{cat.name}</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-light)', background: 'var(--grey)', borderRadius: 999, padding: '1px 6px' }}>
              {cat.article_count || 0}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
