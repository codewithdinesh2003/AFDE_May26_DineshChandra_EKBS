import React, { useState, useEffect } from 'react'
import { categoriesAPI } from '../api/api'
import ConfirmModal from '../components/ConfirmModal'
import Toast, { useToast } from '../components/Toast'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Categories() {
  const { toasts, addToast, removeToast } = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', parent_id: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchCategories = () => {
    categoriesAPI.getAll()
      .then(res => setCategories(res.data.data.categories || []))
      .catch(() => addToast('Failed to load categories', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCategories() }, [])

  const openCreate = () => {
    setEditItem(null)
    setForm({ name: '', description: '', parent_id: '' })
    setFormError('')
    setShowForm(true)
  }

  const openEdit = (cat) => {
    setEditItem(cat)
    setForm({ name: cat.name, description: cat.description || '', parent_id: cat.parent_id || '' })
    setFormError('')
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    try {
      const payload = { name: form.name, description: form.description || null, parent_id: form.parent_id || null }
      if (editItem) {
        await categoriesAPI.update(editItem.id, payload)
        addToast('Category updated', 'success')
      } else {
        await categoriesAPI.create(payload)
        addToast('Category created', 'success')
      }
      setShowForm(false)
      fetchCategories()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      await categoriesAPI.delete(deleteTarget.id)
      addToast('Category deleted', 'success')
      setDeleteTarget(null)
      fetchCategories()
    } catch (err) {
      addToast(err.response?.data?.detail || 'Delete failed', 'error')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="page-container">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="page-header">
        <h1 className="page-title">Categories</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Category</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Articles</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)' }}>No categories yet</td></tr>
              ) : categories.map(cat => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ color: 'var(--text-light)', fontSize: 13 }}>{cat.description || '—'}</td>
                  <td>{cat.article_count || 0}</td>
                  <td style={{ fontSize: 13 }}>{new Date(cat.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(cat)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(cat)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editItem ? 'Edit Category' : 'New Category'}</h3>
            {formError && <div className="alert alert-error">{formError}</div>}
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Category name" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" rows={3} />
              </div>
              <div className="form-group">
                <label>Parent Category</label>
                <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}>
                  <option value="">None (top-level)</option>
                  {categories.filter(c => !editItem || c.id !== editItem.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Category"
          message={`Delete "${deleteTarget.name}"? Articles in this category will lose their category.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
