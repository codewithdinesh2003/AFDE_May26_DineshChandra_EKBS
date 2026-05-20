import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { articlesAPI, ratingsAPI, bookmarksAPI, attachmentsAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import RatingStars from '../components/RatingStars'
import CommentSection from '../components/CommentSection'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfirmModal from '../components/ConfirmModal'
import Toast, { useToast } from '../components/Toast'

export default function ArticleView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin, isReviewer } = useAuth()
  const { toasts, addToast, removeToast } = useToast()

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState({ avg_rating: null, user_rating: null, total_ratings: 0 })
  const [bookmarked, setBookmarked] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectComment, setRejectComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const artRes = await articlesAPI.getById(id)
        setArticle(artRes.data.data)

        const attRes = await attachmentsAPI.getByArticle(id)
        setAttachments(attRes.data.data.attachments || [])

        if (isAuthenticated) {
          const ratingRes = await ratingsAPI.getRating(id)
          setRating(ratingRes.data.data)
        }
      } catch (err) {
        addToast(err.response?.data?.detail || 'Failed to load article', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [id, isAuthenticated])

  const handleRate = async (stars) => {
    if (!isAuthenticated) { addToast('Login to rate', 'error'); return }
    try {
      const res = await ratingsAPI.rate(id, { rating: stars })
      setRating(r => ({ ...r, avg_rating: res.data.data.avg_rating, user_rating: stars }))
      addToast('Rating saved', 'success')
    } catch {
      addToast('Failed to rate', 'error')
    }
  }

  const handleBookmark = async () => {
    if (!isAuthenticated) { addToast('Login to bookmark', 'error'); return }
    try {
      const res = await bookmarksAPI.toggle(id)
      setBookmarked(res.data.data.bookmarked)
      addToast(res.data.message, 'success')
    } catch {
      addToast('Bookmark failed', 'error')
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await articlesAPI.delete(id)
      addToast('Article deleted', 'success')
      setTimeout(() => navigate('/articles'), 1000)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Delete failed', 'error')
    } finally {
      setActionLoading(false)
      setShowDeleteModal(false)
    }
  }

  const handleSubmit = async () => {
    setActionLoading(true)
    try {
      await articlesAPI.submit(id)
      setArticle(a => ({ ...a, status: 'pending' }))
      addToast('Article submitted for review', 'success')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Submit failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprove = async () => {
    setActionLoading(true)
    try {
      await articlesAPI.approve(id, { comments: 'Approved' })
      setArticle(a => ({ ...a, status: 'approved' }))
      addToast('Article approved', 'success')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Approve failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    setActionLoading(true)
    try {
      await articlesAPI.reject(id, { comments: rejectComment })
      setArticle(a => ({ ...a, status: 'rejected' }))
      addToast('Article rejected', 'success')
      setShowRejectModal(false)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Reject failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownload = async (att) => {
    try {
      const res = await attachmentsAPI.download(att.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url; a.download = att.original_name; a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      addToast('Download failed', 'error')
    }
  }

  if (loading) return <LoadingSpinner />
  if (!article) return <div className="page-container"><div className="alert alert-error">Article not found</div></div>

  const isAuthorOrAdmin = user && (article.author_id === user.id || user.role === 'admin')
  const canReview = isAuthenticated && isReviewer() && article.status === 'pending'

  const renderContent = (content) => {
    return content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|u|o|l|p])/gm, '<p>$&</p>')
  }

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.3, flex: 1 }}>{article.title}</h1>
          <StatusBadge status={article.status} />
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
          {article.author_name && <span>👤 {article.author_name}</span>}
          {article.category_name && <span>📁 {article.category_name}</span>}
          <span>👁 {article.view_count} views</span>
          <span>📅 {new Date(article.created_at).toLocaleDateString()}</span>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
            {article.tags.map(t => <span key={t.id} className="tag">{t.name}</span>)}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className={`btn btn-secondary btn-sm`} onClick={handleBookmark}>
            {bookmarked ? '🔖 Bookmarked' : '📌 Bookmark'}
          </button>

          {isAuthorOrAdmin && (
            <>
              <Link to={`/articles/${id}/edit`} className="btn btn-secondary btn-sm">✏️ Edit</Link>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDeleteModal(true)}>🗑 Delete</button>
            </>
          )}

          {isAuthenticated && article.status === 'draft' && article.author_id === user?.id && (
            <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={actionLoading}>
              Submit for Review
            </button>
          )}

          {canReview && (
            <>
              <button className="btn btn-success btn-sm" onClick={handleApprove} disabled={actionLoading}>✓ Approve</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowRejectModal(true)}>✗ Reject</button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      {article.summary && (
        <div style={{ background: 'var(--primary-light)', border: '1px solid #BFDBFE', borderRadius: 8, padding: '12px 16px', marginBottom: 24, fontSize: 15, color: '#1E40AF' }}>
          {article.summary}
        </div>
      )}

      {/* Content */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: renderContent(article.content) }}
        />
      </div>

      {/* Rating */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Rate this article</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <RatingStars rating={rating.user_rating || 0} onRate={handleRate} />
          {rating.avg_rating && (
            <span style={{ fontSize: 14, color: 'var(--text-light)' }}>
              Average: {rating.avg_rating.toFixed(1)} ({rating.total_ratings} ratings)
            </span>
          )}
        </div>
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Attachments</h3>
          <div>
            {attachments.map(att => (
              <div key={att.id} className="file-item">
                <span>📄 {att.original_name}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => handleDownload(att)}>Download</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="card">
        <CommentSection articleId={id} showToast={addToast} />
      </div>

      {/* Modals */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete Article"
          message="Are you sure you want to delete this article? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Reject Article</h3>
            <p style={{ fontSize: 14, color: 'var(--text-light)', marginBottom: 12 }}>Provide feedback for the author:</p>
            <textarea
              value={rejectComment}
              onChange={e => setRejectComment(e.target.value)}
              placeholder="Reason for rejection..."
              style={{ width: '100%', padding: 10, border: '1px solid var(--grey-border)', borderRadius: 6, fontSize: 14, minHeight: 80, resize: 'vertical' }}
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={actionLoading}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
