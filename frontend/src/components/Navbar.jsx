import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, isAuthenticated, logout, isAdmin, isReviewer } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to="/articles" className="navbar-brand">📚 EKBMS</Link>
      <div className="navbar-links">
        <NavLink to="/articles" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Articles</NavLink>
        <NavLink to="/search" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Search</NavLink>
        {isAuthenticated && (
          <>
            <NavLink to="/my-articles" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>My Articles</NavLink>
            <NavLink to="/bookmarks" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Bookmarks</NavLink>
            {isReviewer() && (
              <NavLink to="/approval-queue" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Approval Queue</NavLink>
            )}
            {isAdmin() && (
              <>
                <NavLink to="/categories" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Categories</NavLink>
                <NavLink to="/users" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Users</NavLink>
                <NavLink to="/analytics" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Analytics</NavLink>
              </>
            )}
          </>
        )}
      </div>
      <div className="navbar-right">
        {isAuthenticated ? (
          <div className="user-menu">
            <button className="user-btn" onClick={() => setDropdownOpen(o => !o)}>
              <span>👤</span>
              <span>{user?.name}</span>
              <span style={{ fontSize: 10 }}>▼</span>
            </button>
            {dropdownOpen && (
              <div className="user-dropdown" onClick={() => setDropdownOpen(false)}>
                <div style={{ padding: '10px 16px', fontSize: 12, color: 'var(--text-light)', borderBottom: '1px solid var(--grey-border)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{user?.name}</div>
                  <div>{user?.email}</div>
                  <div style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{user?.role}</div>
                </div>
                <Link to="/dashboard">Dashboard</Link>
                <div className="divider" />
                <button onClick={handleLogout} style={{ color: 'var(--danger)' }}>Logout</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
          </div>
        )}
      </div>
    </nav>
  )
}
