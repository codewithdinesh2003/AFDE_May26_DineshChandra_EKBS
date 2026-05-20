import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      const res = await login(form.email, form.password)
      if (res.success) {
        navigate('/articles')
      } else {
        setError(res.message || 'Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--grey)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40 }}>📚</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginTop: 8 }}>EKBMS</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>Enterprise Knowledge Base</p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Sign in to your account</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, borderTop: '1px solid var(--grey-border)', paddingTop: 16, textAlign: 'center', fontSize: 14 }}>
            <span style={{ color: 'var(--text-light)' }}>Don't have an account? </span>
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Register</Link>
          </div>

          <div style={{ marginTop: 16, background: 'var(--grey)', borderRadius: 8, padding: '12px 16px', fontSize: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-light)' }}>Demo Credentials:</div>
            <div><strong>Admin:</strong> admin@ekbms.com / admin123</div>
            <div><strong>Author:</strong> author@ekbms.com / author123</div>
            <div><strong>Reviewer:</strong> reviewer@ekbms.com / reviewer123</div>
            <div><strong>Employee:</strong> employee@ekbms.com / employee123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
