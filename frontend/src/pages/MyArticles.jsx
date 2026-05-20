import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { articlesAPI } from '../api/api'
import ArticleCard from '../components/ArticleCard'
import Pagination from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'
import Toast, { useToast } from '../components/Toast'

export default function MyArticles() {
  const { toasts, addToast, removeToast } = useToast()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const limit = 10

  const fetchArticles = (p = page) => {
    setLoading(true)
    articlesAPI.getMy({ page: p, limit })
      .then(res => {
        const d = res.data.data
        setArticles(d.articles || [])
        setTotal(d.total || 0)
        setTotalPages(d.total_pages || 1)
      })
      .catch(() => addToast('Failed to load articles', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchArticles() }, [page])

  const handleDelete = async () => {
    try {
      await articlesAPI.delete(deleteTarget.id)
      addToast('Article deleted', 'success')
      setDeleteTarget(null)
      fetchArticles()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Delete failed', 'error')
    }
  }

  const handleSubmit = async (articleId) => {
    try {
      await articlesAPI.submit(articleId)
      setArticles(a => a.map(x => x.id === articleId ? { ...x, status: 'pending' } : x))
      addToast('Article submitted for review', 'success')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Submit failed', 'error')
    }
  }

  return (
    <div className="page-container">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="page-header">
        <h1 className="page-title">My Articles</h1>
        <Link to="/articles/new" className="btn btn-primary">+ New Article</Link>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>{total} total articles</div>

      {loading ? <LoadingSpinner /> : articles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✍️</div>
          <div className="empty-state-text">You haven't written any articles yet.</div>
          <Link to="/articles/new" className="btn btn-primary" style={{ marginTop: 16 }}>Write your first article</Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {articles.map(a => (
              <div key={a.id} style={{ background: 'white', borderRadius: 8, boxShadow: 'var(--shadow)', padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <Link to={`/articles/${a.id}`} style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', textDecoration: 'none' }}>
                        {a.title}
                      </Link>
                      <span className={`badge badge-${a.status}`}>{a.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)', display: 'flex', gap: 12 }}>
                      {a.category_name && <span>📁 {a.category_name}</span>}
                      <span>👁 {a.view_count}</span>
                      <span>📅 {new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {a.status === 'draft' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleSubmit(a.id)}>Submit</button>
                    )}
                    <Link to={`/articles/${a.id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                    <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(a)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Article"
          message={`Delete "${deleteTarget.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
