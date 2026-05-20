import React from 'react'

export default function StatusBadge({ status }) {
  const map = {
    draft: 'badge-draft',
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    archived: 'badge-archived',
  }
  return <span className={`badge ${map[status] || 'badge-draft'}`}>{status}</span>
}
