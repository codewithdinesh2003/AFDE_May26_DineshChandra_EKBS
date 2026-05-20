import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { articlesAPI, categoriesAPI, tagsAPI, attachmentsAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import ArticleEditor from '../components/ArticleEditor'
import FileUpload from '../components/FileUpload'
import Toast, { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ArticleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthor } = useAuth()
  const isEdit = !!id
  const { toasts, addToast, removeToast } = useToast()

  const [form, setForm] = useState({ title: '', summary: '', content: '', category_id: '', tag_ids: [] })
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [attachments, setAttachments] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    Promise.all([categoriesAPI.getAll(), tagsAPI.getAll()])
      .then(([catRes, tagRes]) => {
        setCategories(catRes.data.data.categories || [])
        setTags(tagRes.data.data.tags || [])
      })
      .catch(console.error)

    if (isEdit) {
      Promise.all([articlesAPI.getById(id), attachmentsAPI.getByArticle(id)])
        .then(([artRes, attRes]) => {
          const a = artRes.data.data
          setForm({
            title: a.title || '',
            summary: a.summary || '',
            content: a.content || '',
            category_id: a.category_id || '',
            tag_ids: (a.tags || []).map(t => t.id)
          })
          setAttachments(attRes.data.data.attachments || [])
        })
        .catch(err => addToast(err.response?.data?.detail || 'Failed to load article', 'error'))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.content.trim()) e.content = 'Content is required'
    return e
  }

  const handleSave = async (submitAfter = false) => {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        summary: form.summary,
        content: form.content,
        category_id: form.category_id || null,
        tag_ids: form.tag_ids
      }
      let articleId = id
      if (isEdit) {
        await articlesAPI.update(id, payload)
        addToast('Article updated', 'success')
      } else {
        const res = await articlesAPI.create(payload)
        articleId = res.data.data.id
        addToast('Article created', 'success')
      }
      if (submitAfter) {
        await articlesAPI.submit(articleId)
        addToast('Article submitted for review', 'success')
      }
      setTimeout(() => navigate(`/articles/${articleId}`), 800)
    } catch (err) {
      addToast(err.response?.data?.detail || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleTag = (tagId) => {
    setForm(f => ({
      ...f,
      tag_ids: f.tag_ids.includes(tagId)
        ? f.tag_ids.filter(t => t !== tagId)
        : [...f.tag_ids, tagId]
    }))
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Article' : 'New Article'}</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
        {/* Main form */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setErrors(er => ({ ...er, title: '' })) }}
                placeholder="Article title"
              />
              {errors.title && <div className="error">{errors.title}</div>}
            </div>

            <div className="form-group">
              <label>Summary</label>
              <textarea
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="Brief description (optional)"
                rows={3}
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Content *</label>
            <ArticleEditor
              value={form.content}
              onChange={v => { setForm(f => ({ ...f, content: v })); setErrors(er => ({ ...er, content: '' })) }}
            />
            {errors.content && <div className="error" style={{ marginTop: 4 }}>{errors.content}</div>}
          </div>

          {isEdit && (
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Attachments</h3>
              <FileUpload
                articleId={id}
                attachments={attachments}
                onUpload={att => setAttachments(a => [...a, att])}
                onDelete={attId => setAttachments(a => a.filter(x => x.id !== attId))}
                showToast={addToast}
              />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Category</h3>
            <select
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--grey-border)', fontSize: 14 }}
            >
              <option value="">None</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Tags</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    cursor: 'pointer',
                    border: '1px solid var(--primary)',
                    background: form.tag_ids.includes(tag.id) ? 'var(--primary)' : 'transparent',
                    color: form.tag_ids.includes(tag.id) ? 'white' : 'var(--primary)',
                    fontWeight: 500
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                className="btn btn-secondary w-full"
                onClick={() => handleSave(false)}
                disabled={saving}
                style={{ justifyContent: 'center' }}
              >
                {saving ? 'Saving...' : '💾 Save as Draft'}
              </button>
              <button
                className="btn btn-primary w-full"
                onClick={() => handleSave(true)}
                disabled={saving}
                style={{ justifyContent: 'center' }}
              >
                {saving ? 'Saving...' : '📤 Save & Submit for Review'}
              </button>
              <button
                className="btn btn-secondary w-full"
                onClick={() => navigate(-1)}
                style={{ justifyContent: 'center' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
