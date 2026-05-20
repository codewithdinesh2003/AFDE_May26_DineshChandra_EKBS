import React, { useState, useRef } from 'react'
import { attachmentsAPI } from '../api/api'

const ALLOWED = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']
const MAX_SIZE = 10 * 1024 * 1024

export default function FileUpload({ articleId, attachments = [], onUpload, onDelete, showToast }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = async (files) => {
    for (const file of files) {
      const ext = file.name.split('.').pop().toLowerCase()
      if (!ALLOWED.includes(ext)) {
        showToast && showToast(`File type .${ext} not allowed`, 'error')
        continue
      }
      if (file.size > MAX_SIZE) {
        showToast && showToast(`${file.name} exceeds 10MB limit`, 'error')
        continue
      }
      setUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await attachmentsAPI.upload(articleId, formData)
        onUpload && onUpload(res.data.data)
        showToast && showToast('File uploaded', 'success')
      } catch (err) {
        showToast && showToast(err.response?.data?.detail || 'Upload failed', 'error')
      } finally {
        setUploading(false)
      }
    }
  }

  const handleInputChange = (e) => {
    if (e.target.files) handleFiles(Array.from(e.target.files))
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files) handleFiles(Array.from(e.dataTransfer.files))
  }

  const handleDelete = async (attachmentId) => {
    try {
      await attachmentsAPI.delete(attachmentId)
      onDelete && onDelete(attachmentId)
      showToast && showToast('Attachment deleted', 'success')
    } catch (err) {
      showToast && showToast('Failed to delete attachment', 'error')
    }
  }

  const handleDownload = async (attachment) => {
    try {
      const res = await attachmentsAPI.download(attachment.id)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.original_name
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showToast && showToast('Download failed', 'error')
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  return (
    <div>
      <div
        className="file-upload-area"
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
        <p style={{ fontSize: 14, color: 'var(--text-light)' }}>
          {uploading ? 'Uploading...' : 'Click or drag files here'}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
          Supported: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG (max 10MB)
        </p>
        <input ref={inputRef} type="file" multiple style={{ display: 'none' }} onChange={handleInputChange} />
      </div>

      {attachments.length > 0 && (
        <div className="file-list">
          {attachments.map(att => (
            <div key={att.id} className="file-item">
              <span>📄 {att.original_name} {att.file_size && `(${formatSize(att.file_size)})`}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDownload(att)}
                >
                  Download
                </button>
                {onDelete && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(att.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
