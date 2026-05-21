import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { analyticsAPI, downloadBlob } from '../api/api'
import LoadingSpinner from '../components/LoadingSpinner'
import HorizontalBar from '../components/charts/HorizontalBar'
import LineChart from '../components/charts/LineChart'
import BarChart from '../components/charts/BarChart'

// ── helpers ──────────────────────────────────────────────────────────────────

function Stars({ rating }) {
  const r = Math.round(rating || 0)
  return (
    <span style={{ color: '#F59E0B', fontSize: 13 }}>
      {'★'.repeat(r)}{'☆'.repeat(5 - r)}
      <span style={{ color: '#94a3b8', marginLeft: 4 }}>{(rating || 0).toFixed(1)}</span>
    </span>
  )
}

function PeriodSelector({ period, onChange }) {
  return (
    <div className="period-selector">
      {[['7d', '7 Days'], ['30d', '30 Days'], ['90d', '90 Days']].map(([v, label]) => (
        <button key={v} className={`period-btn${period === v ? ' active' : ''}`} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  )
}

const AVATAR_COLORS = ['#2563EB', '#7c3aed', '#0891b2', '#16a34a', '#d97706', '#dc2626']

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function TabOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    analyticsAPI.getDashboard()
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="alert alert-error">{error}</div>

  const metrics = [
    { icon: '📄', label: 'Total Articles', value: data.total_articles, color: '#2563EB' },
    { icon: '✅', label: 'Approved', value: data.approved_articles, color: '#16a34a' },
    { icon: '⏳', label: 'Pending', value: data.pending_articles, color: '#d97706' },
    { icon: '👥', label: 'Total Users', value: data.total_users, color: '#7c3aed' },
    { icon: '🗂️', label: 'Categories', value: data.total_categories, color: '#0891b2' },
    { icon: '🏷️', label: 'Tags', value: data.total_tags, color: '#64748b' },
  ]

  const statusData = Object.entries(data.articles_by_status || {}).map(([k, v]) => ({
    label: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
    color: { approved: '#16a34a', pending: '#d97706', draft: '#6b7280', rejected: '#dc2626', archived: '#2563EB' }[k] || '#64748b',
  }))

  const catData = (data.articles_by_category || []).map(c => ({
    label: c.category_name,
    value: c.count,
    color: '#2563EB',
  }))

  return (
    <div>
      {/* Metric cards */}
      <div className="metrics-grid">
        {metrics.map(m => (
          <div key={m.label} className="metric-card">
            <div className="metric-icon">{m.icon}</div>
            <div className="metric-value" style={{ color: m.color }}>{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Two-col: top articles + status */}
      <div className="two-col">
        <div className="analytics-card">
          <h3>Top 10 Most Viewed Articles</h3>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', width: 32 }}>#</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Title</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Views</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {(data.most_viewed || []).slice(0, 10).map((a, i) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '6px 8px', color: i < 3 ? '#F59E0B' : '#94a3b8', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <Link to={`/articles/${a.id}`} style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 500 }}>
                      {a.title.length > 40 ? a.title.slice(0, 40) + '…' : a.title}
                    </Link>
                  </td>
                  <td style={{ padding: '6px 8px', color: '#64748b' }}>{a.category_name || '—'}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>{a.view_count}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                    <Stars rating={a.avg_rating} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="analytics-card">
          <h3>Articles by Status</h3>
          <HorizontalBar data={statusData} />
        </div>
      </div>

      {/* Category breakdown */}
      <div className="analytics-card">
        <h3>Articles by Category</h3>
        <HorizontalBar data={catData} />
      </div>
    </div>
  )
}

// ── Tab: Trends ───────────────────────────────────────────────────────────────

function TabTrends() {
  const [period, setPeriod] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    analyticsAPI.getTrends(period)
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [period])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="alert alert-error">{error}</div>

  const growth = data?.growth || {}
  const growthPct = growth.growth_percentage ?? 0
  const isPositive = growthPct >= 0

  const dailyData = (data?.daily_views || []).map(d => ({
    label: d.view_date,
    value: d.total_views || 0,
  }))

  const avgViews = data?.category_trends?.length
    ? data.category_trends.reduce((s, c) => s + c.total_views, 0) / data.category_trends.length
    : 0

  return (
    <div>
      <PeriodSelector period={period} onChange={setPeriod} />

      {/* Growth badges */}
      <div className="growth-badges">
        <div className="growth-badge">Articles This Period: <strong>{growth.articles_this_period ?? 0}</strong></div>
        <div className="growth-badge">Articles Last Period: <strong>{growth.articles_last_period ?? 0}</strong></div>
        <div className={`growth-badge ${isPositive ? 'positive' : 'negative'}`}>
          Growth: {isPositive ? '+' : ''}{growthPct}% {isPositive ? '▲' : '▼'}
        </div>
      </div>

      {/* Daily views line chart */}
      <div className="analytics-card">
        <h3>Daily Article Views</h3>
        <LineChart data={dailyData} color="#2563EB" title="" height={220} />
      </div>

      {/* Category trends table */}
      <div className="analytics-card">
        <h3>Category Trends</h3>
        {(!data?.category_trends || data.category_trends.length === 0) ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No trend data yet. Import articles to populate trends.</p>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Articles</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total Views</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {[...data.category_trends]
                .sort((a, b) => b.total_views - a.total_views)
                .map(r => (
                  <tr key={r.category_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{r.category_name}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{r.article_count}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{r.total_views.toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', color: r.total_views >= avgViews ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                      {r.total_views >= avgViews ? '▲' : '▼'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ── Tab: Keywords ─────────────────────────────────────────────────────────────

function TabKeywords() {
  const [period, setPeriod] = useState('30d')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    analyticsAPI.getKeywords(20, period)
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [period])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="alert alert-error">{error}</div>

  const barData = (data?.top_keywords || []).map(k => ({
    label: k.keyword,
    value: k.search_count,
  }))

  const volumeData = (data?.search_volume_by_day || []).map(d => ({
    label: d.date,
    value: d.count,
  }))

  return (
    <div>
      <PeriodSelector period={period} onChange={setPeriod} />

      {/* Top keywords bar chart */}
      <div className="analytics-card">
        <h3>Top Searched Keywords</h3>
        {barData.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No search data yet. Searches will appear here as users search the knowledge base.</p>
        ) : (
          <>
            <BarChart data={barData} color="#7c3aed" height={220} />
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginTop: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Keyword</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Searches</th>
                  <th style={{ padding: '6px 10px', textAlign: 'right' }}>Avg Results</th>
                </tr>
              </thead>
              <tbody>
                {(data?.top_keywords || []).map(k => (
                  <tr key={k.keyword} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '6px 10px', fontWeight: 500 }}>{k.keyword}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{k.search_count}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#64748b' }}>{k.avg_results}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Zero result searches — content gaps */}
      <div className="content-gap-card">
        <h3>⚠️ Zero Result Searches (Content Gaps)</h3>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          These searches returned no results — consider creating articles on these topics
        </p>
        {(!data?.zero_result_searches || data.zero_result_searches.length === 0) ? (
          <p style={{ fontSize: 13, color: '#16a34a' }}>✅ No zero-result searches yet — great content coverage!</p>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fef2f2' }}>
                <th style={{ padding: '6px 10px', textAlign: 'left' }}>Keyword</th>
                <th style={{ padding: '6px 10px', textAlign: 'right' }}>Times Searched</th>
              </tr>
            </thead>
            <tbody>
              {data.zero_result_searches.map(k => (
                <tr key={k.keyword} style={{ borderBottom: '1px solid #fecaca' }}>
                  <td style={{ padding: '6px 10px', fontWeight: 500 }}>{k.keyword}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>{k.search_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Search volume by day */}
      <div className="analytics-card">
        <h3>Search Volume by Day</h3>
        {volumeData.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 13 }}>No search volume data yet.</p>
        ) : (
          <BarChart data={volumeData} color="#0891b2" height={200} />
        )}
      </div>
    </div>
  )
}

// ── Tab: Authors ──────────────────────────────────────────────────────────────

function TabAuthors() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortKey, setSortKey] = useState('total_views')
  const [sortDir, setSortDir] = useState(-1)

  useEffect(() => {
    analyticsAPI.getAuthors()
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.detail || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />
  if (error) return <div className="alert alert-error">{error}</div>

  const authors = [...(data?.authors || [])].sort((a, b) => sortDir * (b[sortKey] - a[sortKey]))

  function handleSort(key) {
    if (key === sortKey) setSortDir(d => -d)
    else { setSortKey(key); setSortDir(-1) }
  }

  const SortTh = ({ k, children }) => (
    <th className="sortable-th" style={{ padding: '8px 12px', textAlign: 'right', background: '#f8fafc' }}
      onClick={() => handleSort(k)}>
      {children} {sortKey === k ? (sortDir === -1 ? '▼' : '▲') : ''}
    </th>
  )

  const rankEmoji = (i) => ['🥇', '🥈', '🥉'][i] || String(i + 1)
  const top3 = authors.slice(0, 3)

  return (
    <div>
      {/* Top 3 mini cards */}
      <div className="author-cards">
        {top3.map((a, i) => (
          <div key={a.id} className="author-mini-card">
            <div className="author-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
              {a.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{a.total_views.toLocaleString()} views</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>{a.total_articles} articles</div>
            </div>
          </div>
        ))}
      </div>

      {/* Leaderboard table */}
      <div className="analytics-card">
        <h3>Author Leaderboard</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {[['total_articles', 'Total Articles'], ['total_views', 'Total Views'], ['avg_rating', 'Avg Rating']].map(([k, label]) => (
            <button key={k}
              className={`period-btn${sortKey === k ? ' active' : ''}`}
              onClick={() => handleSort(k)}>
              Sort by {label}
            </button>
          ))}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f8fafc' }}>Rank</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f8fafc' }}>Author</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f8fafc' }}>Email</th>
                <SortTh k="total_articles">Articles</SortTh>
                <SortTh k="approved_articles">Approved</SortTh>
                <SortTh k="total_views">Views</SortTh>
                <SortTh k="avg_rating">Avg Rating</SortTh>
                <th style={{ padding: '8px 12px', textAlign: 'left', background: '#f8fafc' }}>Top Article</th>
              </tr>
            </thead>
            <tbody>
              {authors.map((a, i) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 12px', fontSize: 16 }}>{rankEmoji(i)}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                        color: 'white', fontWeight: 700, fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>{a.name.charAt(0).toUpperCase()}</div>
                      {a.name}
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#64748b' }}>{a.email}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{a.total_articles}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', color: '#16a34a' }}>{a.approved_articles}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{a.total_views.toLocaleString()}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'right' }}><Stars rating={a.avg_rating} /></td>
                  <td style={{ padding: '8px 12px', maxWidth: 180 }}>
                    {a.most_viewed_article ? (
                      <Link to={`/articles/${a.most_viewed_article.id}`}
                        style={{ color: '#2563EB', textDecoration: 'none', fontSize: 12 }}>
                        {a.most_viewed_article.title.length > 35
                          ? a.most_viewed_article.title.slice(0, 35) + '…'
                          : a.most_viewed_article.title}
                      </Link>
                    ) : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Export ───────────────────────────────────────────────────────────────

function TabExport() {
  const [downloading, setDownloading] = useState({})
  const [toast, setToast] = useState('')

  async function handleExport(type, filename) {
    setDownloading(d => ({ ...d, [type]: true }))
    try {
      const res = await analyticsAPI.exportReport(type)
      downloadBlob(res.data, filename)
      setToast(`✅ ${filename} downloaded!`)
      setTimeout(() => setToast(''), 3000)
    } catch (e) {
      setToast('❌ Export failed: ' + (e.response?.data?.detail || e.message))
      setTimeout(() => setToast(''), 4000)
    } finally {
      setDownloading(d => ({ ...d, [type]: false }))
    }
  }

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const reports = [
    {
      type: 'articles', icon: '📄', title: 'Articles Report',
      desc: 'All articles with category, author, status, views and ratings',
      cols: 'id, title, category, author, status, views, avg_rating, created_at',
      filename: `articles_report_${today}.csv`,
    },
    {
      type: 'keywords', icon: '🔍', title: 'Search Keywords Report',
      desc: 'All search keywords with frequency and average results count',
      cols: 'keyword, search_count, avg_results, last_searched',
      filename: `keywords_report_${today}.csv`,
    },
    {
      type: 'authors', icon: '👤', title: 'Author Activity Report',
      desc: 'Author activity including article counts, views and ratings',
      cols: 'name, email, total_articles, approved, views, avg_rating',
      filename: `authors_report_${today}.csv`,
    },
    {
      type: 'category_trends', icon: '📈', title: 'Category Trends Report',
      desc: 'Weekly category usage trends with article counts and view totals',
      cols: 'category, week_start, article_count, total_views',
      filename: `category_trends_report_${today}.csv`,
    },
  ]

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, background: '#1e293b', color: 'white',
          padding: '10px 20px', borderRadius: 8, fontSize: 14, zIndex: 999
        }}>{toast}</div>
      )}
      <div className="export-grid">
        {reports.map(r => (
          <div key={r.type} className="export-card">
            <div className="export-icon">{r.icon}</div>
            <h4>{r.title}</h4>
            <p>{r.desc}</p>
            <div className="columns-preview">{r.cols}</div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={downloading[r.type]}
              onClick={() => handleExport(r.type, r.filename)}
            >
              {downloading[r.type] ? '⏳ Downloading…' : '⬇️ Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Analytics Page ───────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: '📊 Overview' },
  { id: 'trends', label: '📈 Trends' },
  { id: 'keywords', label: '🔍 Search Analytics' },
  { id: 'authors', label: '👤 Authors' },
  { id: 'export', label: '⬇️ Export' },
]

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabContent = {
    overview: <TabOverview />,
    trends: <TabTrends />,
    keywords: <TabKeywords />,
    authors: <TabAuthors />,
    export: <TabExport />,
  }

  return (
    <div className="analytics-page">
      <h1 style={{ margin: '0 0 20px 0' }}>Analytics Dashboard</h1>

      <div className="analytics-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${activeTab === t.id ? ' active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabContent[activeTab]}
    </div>
  )
}
