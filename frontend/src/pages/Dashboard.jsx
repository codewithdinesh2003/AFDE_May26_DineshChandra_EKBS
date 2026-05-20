import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="page-container"><div className="alert alert-error">{error}</div></div>

  const metrics = [
    { label: 'Total Articles', value: data.total_articles, color: 'var(--primary)' },
    { label: 'Approved', value: data.approved_articles, color: 'var(--success)' },
    { label: 'Pending Review', value: data.pending_articles, color: 'var(--warning)' },
    { label: 'Total Users', value: data.total_users, color: '#8B5CF6' },
  ]

  const statusList = Object.entries(data.articles_by_status || {})
  const maxCount = Math.max(...statusList.map(([, v]) => v), 1)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <Link to="/articles/new" className="btn btn-primary">+ New Article</Link>
      </div>

      {/* Metrics */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {metrics.map(m => (
          <div key={m.label} className="metric-card">
            <div className="metric-label">{m.label}</div>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Most Viewed */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Most Viewed Articles</h3>
          {data.most_viewed?.length === 0 ? (
            <p className="text-muted text-sm">No articles yet</p>
          ) : (
            <table>
              <thead>
                <tr><th>Title</th><th>Views</th></tr>
              </thead>
              <tbody>
                {data.most_viewed?.map(a => (
                  <tr key={a.id}>
                    <td><Link to={`/articles/${a.id}`} style={{ color: 'var(--primary)' }}>{a.title}</Link></td>
                    <td>{a.view_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Articles */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent Articles</h3>
          {data.recent_articles?.length === 0 ? (
            <p className="text-muted text-sm">No articles yet</p>
          ) : (
            <table>
              <thead>
                <tr><th>Title</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.recent_articles?.map(a => (
                  <tr key={a.id}>
                    <td><Link to={`/articles/${a.id}`} style={{ color: 'var(--primary)' }}>{a.title}</Link></td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid-2">
        {/* Articles by Status */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Articles by Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {statusList.map(([status, count]) => (
              <div key={status}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{status}</span>
                  <span>{count}</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      background: status === 'approved' ? 'var(--success)' :
                        status === 'pending' ? 'var(--warning)' :
                        status === 'rejected' ? 'var(--danger)' :
                        status === 'archived' ? 'var(--primary)' : 'var(--grey-dark)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Articles by Category */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Articles by Category</h3>
          {data.articles_by_category?.length === 0 ? (
            <p className="text-muted text-sm">No data yet</p>
          ) : (
            <table>
              <thead>
                <tr><th>Category</th><th>Articles</th></tr>
              </thead>
              <tbody>
                {data.articles_by_category?.map(c => (
                  <tr key={c.category_name}>
                    <td>{c.category_name}</td>
                    <td>{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
