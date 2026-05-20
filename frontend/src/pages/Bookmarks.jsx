import React, { useState, useEffect } from 'react'
import { bookmarksAPI } from '../api/api'
import ArticleCard from '../components/ArticleCard'
import LoadingSpinner from '../components/LoadingSpinner'
import Toast, { useToast } from '../components/Toast'

export default function Bookmarks() {
  const { toasts, addToast, removeToast } = useToast()
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    bookmarksAPI.getAll()
      .then(res => setBookmarks(res.data.data.bookmarks || []))
      .catch(() => addToast('Failed to load bookmarks', 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="page-header">
        <h1 className="page-title">My Bookmarks</h1>
        <span style={{ fontSize: 14, color: 'var(--text-light)' }}>{bookmarks.length} saved</span>
      </div>

      {loading ? <LoadingSpinner /> : bookmarks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔖</div>
          <div className="empty-state-text">No bookmarks yet. Browse articles and bookmark your favorites!</div>
        </div>
      ) : (
        <div className="articles-grid">
          {bookmarks.map(bm => (
            <ArticleCard key={bm.bookmark_id} article={bm.article} />
          ))}
        </div>
      )}
    </div>
  )
}
