import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { articlesAPI } from '../api/api'
import Pagination from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast, { useToast } from '../components/Toast'

export default function ApprovalQueue() {
  const { toasts, addToast, removeToast } = useToast()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectComment, setRejectComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const limit = 15

  const fetchArticles = (p = page) => {
    setLoading(true)
    articlesAPI.getPending({ page: p, limit })
      .then(res => {
        const d = res.data.data
        setArticles(d.articles || [])
        setTotal(d.total || 0)
        setTotalPages(d.total_pages || 1)
      })
      .catch(() => addToast('Failed to load pending articles', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchArticles() }, [page])

  const handleApprove = async (articleId) => {
    setActionLoading(true)
    try {
      await articlesAPI.approve(articleId, { comments: 'Approved' })
      setArticles(a => a.filter(x => x.id !== articleId))
      setTotal(t => t - 1)
      addToast('Article approved', 'success')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Approve failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectModal) return
    setActionLoading(true)
    try {
      await articlesAPI.reject(rejectModal.id, { comments: rejectComment })
      setArticles(a => a.filter(x => x.id !== rejectModal.id))
      setTotal(t => t - 1)
      addToast('Article rejected', 'success')
      setRejectModal(null)
      setRejectComment('')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Reject failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="page-container">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="page-header">
        <h1 className="page-title">Approval Queue</h1>
        <span style={{ background: 'var(--warning-light)', color: 'var(--warning)', fontWeight: 700, padding: '4px 12px', borderRadius: 999, fontSize: 14 }}>
          {total} pending
        </span>
      </div>

      {loading ? <LoadingSpinner /> : articles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-text">No articles pending review. You're all caught up!</div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Article Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(a => (
                  <tr key={a.id}>
                    <td>
                      <Link to={`/articles/${a.id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {a.title}
                      </Link>
                      {a.tags && a.tags.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          {a.tags.map(t => <span key={t.id} className="tag" style={{ fontSize: 10 }}>{t.name}</span>)}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: 13 }}>{a.author_name || '—'}</td>
                    <td style={{ fontSize: 13 }}>{a.category_name || '—'}</td>
                    <td style={{ fontSize: 13 }}>{new Date(a.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(a.id)}
                          disabled={actionLoading}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => { setRejectModal(a); setRejectComment('') }}
                          disabled={actionLoading}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Reject Article</h3>
            <p style={{ fontSize: 14, marginBottom: 4 }}>
              Rejecting: <strong>{rejectModal.title}</strong>
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
              Provide feedback for the author (optional):
            </p>
            <textarea
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              placeholder="Reason for rejection..."
              style={{ width: '100%', padding: 10, border: '1px solid var(--grey-border)', borderRadius: 6, fontSize: 14, minHeight: 80, resize: 'vertical' }}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading}>
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
