import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>

  const statusItems = Object.entries(data.articles_by_status || {})
  const maxStatus = Math.max(...statusItems.map(([, v]) => v), 1)

  const statusColors = {
    draft: 'var(--grey-dark)',
    pending: 'var(--warning)',
    approved: 'var(--success)',
    rejected: 'var(--danger)',
    archived: 'var(--primary)'
  }

  const maxCat = Math.max(...(data.articles_by_category || []).map(c => c.count), 1)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Analytics</h1>
      </div>

      {/* Top metrics */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Articles', value: data.total_articles, color: 'var(--primary)', icon: '📄' },
          { label: 'Approved', value: data.approved_articles, color: 'var(--success)', icon: '✅' },
          { label: 'Pending Review', value: data.pending_articles, color: 'var(--warning)', icon: '⏳' },
          { label: 'Total Users', value: data.total_users, color: '#8B5CF6', icon: '👥' },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <div style={{ fontSize: 24 }}>{m.icon}</div>
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-3" style={{ marginBottom: 28 }}>
        {[
          { label: 'Draft', value: data.articles_by_status?.draft || 0, color: 'var(--grey-dark)' },
          { label: 'Categories', value: data.total_categories, color: 'var(--primary)' },
          { label: 'Tags', value: data.total_tags, color: '#8B5CF6' },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Articles by Status */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Articles by Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {statusItems.map(([status, count]) => (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600, color: statusColors[status] }}>{status}</span>
                  <span style={{ fontWeight: 700 }}>{count}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(count / maxStatus) * 100}%`, background: statusColors[status] }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Articles by Category */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Articles by Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data.articles_by_category || []).map(c => (
              <div key={c.category_name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 500 }}>{c.category_name}</span>
                  <span>{c.count}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(c.count / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
            {(!data.articles_by_category || data.articles_by_category.length === 0) && (
              <p className="text-muted text-sm">No category data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid-3">
        {/* Most Viewed */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🔥 Most Viewed</h3>
          {(data.most_viewed || []).length === 0 ? (
            <p className="text-muted text-sm">No data yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.most_viewed.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center', fontWeight: 700, color: i < 3 ? '#F59E0B' : 'var(--text-light)' }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/articles/${a.id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.title}
                    </Link>
                    <span style={{ fontSize: 11, color: 'var(--text-light)' }}>👁 {a.view_count} views</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Rated */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⭐ Top Rated</h3>
          {(data.top_rated || []).length === 0 ? (
            <p className="text-muted text-sm">No ratings yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.top_rated.map((a, i) => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, width: 24, textAlign: 'center', fontWeight: 700, color: i < 3 ? '#F59E0B' : 'var(--text-light)' }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/articles/${a.id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.title}
                    </Link>
                    <span style={{ fontSize: 11, color: '#F59E0B' }}>{'★'.repeat(Math.round(a.avg_rating || 0))} {a.avg_rating?.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Articles */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🕐 Recent Articles</h3>
          {(data.recent_articles || []).length === 0 ? (
            <p className="text-muted text-sm">No articles yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.recent_articles.map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <Link to={`/articles/${a.id}`} style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.title}
                  </Link>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
