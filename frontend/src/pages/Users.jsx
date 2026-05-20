import React, { useState, useEffect } from 'react'
import { usersAPI } from '../api/api'
import Toast, { useToast } from '../components/Toast'
import Pagination from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'

const ROLES = ['employee', 'author', 'reviewer', 'admin']

export default function Users() {
  const { toasts, addToast, removeToast } = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 15

  const fetchUsers = (p = page) => {
    setLoading(true)
    usersAPI.getAll({ page: p, limit })
      .then(res => {
        const d = res.data.data
        setUsers(d.users || [])
        setTotal(d.total || 0)
        setTotalPages(d.total_pages || 1)
      })
      .catch(() => addToast('Failed to load users', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [page])

  const handleRoleChange = async (userId, role) => {
    try {
      await usersAPI.updateRole(userId, { role })
      setUsers(u => u.map(x => x.id === userId ? { ...x, role } : x))
      addToast('Role updated', 'success')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update role', 'error')
    }
  }

  const handleToggleStatus = async (user) => {
    try {
      await usersAPI.updateStatus(user.id, { is_active: !user.is_active })
      setUsers(u => u.map(x => x.id === user.id ? { ...x, is_active: !user.is_active } : x))
      addToast(`User ${!user.is_active ? 'activated' : 'deactivated'}`, 'success')
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to update status', 'error')
    }
  }

  const roleBadgeColor = { admin: 'var(--danger)', reviewer: 'var(--primary)', author: 'var(--success)', employee: 'var(--grey-dark)' }

  return (
    <div className="page-container">
      <Toast toasts={toasts} removeToast={removeToast} />

      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <span style={{ fontSize: 14, color: 'var(--text-light)' }}>{total} total users</span>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600 }}>{user.name}</td>
                    <td style={{ fontSize: 13 }}>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid var(--grey-border)',
                          fontSize: 13,
                          background: 'white',
                          color: roleBadgeColor[user.role] || 'inherit'
                        }}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r} style={{ color: roleBadgeColor[r] }}>{r}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
