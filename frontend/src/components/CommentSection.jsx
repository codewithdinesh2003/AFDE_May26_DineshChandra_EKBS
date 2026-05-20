import React, { useState, useEffect } from 'react'
import { commentsAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

export default function CommentSection({ articleId, showToast }) {
  const { isAuthenticated, user } = useAuth()
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const fetchComments = async () => {
    try {
      const res = await commentsAPI.getByArticle(articleId)
      setComments(res.data.data.comments || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [articleId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      await commentsAPI.create(articleId, { comment_text: newComment })
      setNewComment('')
      await fetchComments()
      showToast && showToast('Comment added', 'success')
    } catch (err) {
      showToast && showToast(err.response?.data?.detail || 'Failed to add comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    try {
      await commentsAPI.delete(commentId)
      setComments(c => c.filter(x => x.id !== commentId))
      showToast && showToast('Comment deleted', 'success')
    } catch (err) {
      showToast && showToast('Failed to delete comment', 'error')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Comments ({comments.length})</h3>

      {comments.length === 0 ? (
        <p className="text-muted text-sm" style={{ marginBottom: 16 }}>No comments yet. Be the first to comment!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {comments.map(c => (
            <div key={c.id} style={{ background: 'var(--grey)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{c.user_name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: 8 }}>
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                {(user?.id === c.user_id || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 12 }}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>{c.comment_text}</p>
            </div>
          ))}
        </div>
      )}

      {isAuthenticated ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting || !newComment.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <p className="text-muted text-sm">Please <a href="/login" style={{ color: 'var(--primary)' }}>login</a> to comment.</p>
      )}
    </div>
  )
}
