import React from 'react'
import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge'
import RatingStars from './RatingStars'

export default function ArticleCard({ article, showStatus = false }) {
  return (
    <Link to={`/articles/${article.id}`} className="article-card" style={{ textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <h3 className="article-card-title">{article.title}</h3>
        {showStatus && <StatusBadge status={article.status} />}
      </div>

      {article.summary && (
        <p className="text-sm text-muted" style={{ lineHeight: 1.5 }}>
          {article.summary.length > 120 ? article.summary.slice(0, 120) + '…' : article.summary}
        </p>
      )}

      <div className="article-card-meta">
        {article.category_name && <span>📁 {article.category_name}</span>}
        {article.author_name && <span>👤 {article.author_name}</span>}
        <span>👁 {article.view_count || 0}</span>
        {article.avg_rating && (
          <span>⭐ {article.avg_rating.toFixed(1)}</span>
        )}
        {article.created_at && (
          <span>{new Date(article.created_at).toLocaleDateString()}</span>
        )}
      </div>

      {article.tags && article.tags.length > 0 && (
        <div className="article-card-tags">
          {article.tags.map(tag => (
            <span key={tag.id} className="tag">{tag.name}</span>
          ))}
        </div>
      )}
    </Link>
  )
}
