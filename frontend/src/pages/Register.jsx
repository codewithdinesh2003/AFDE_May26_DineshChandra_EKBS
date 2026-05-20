import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../api/api'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.password) e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      const res = await authAPI.register({ name: form.name, email: form.email, password: form.password })
      if (res.data.success) {
        localStorage.setItem('token', res.data.data.token)
        navigate('/articles')
      }
    } catch (err) {
      setApiError(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ field, label, type = 'text', placeholder }) => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={form[field]}
        onChange={e => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(er => ({ ...er, [field]: '' })) }}
        placeholder={placeholder}
      />
      {errors[field] && <div className="error">{errors[field]}</div>}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--grey)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40 }}>📚</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', marginTop: 8 }}>EKBMS</h1>
          <p style={{ color: 'var(--text-light)', fontSize: 14, marginTop: 4 }}>Enterprise Knowledge Base</p>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Create your account</h2>
          {apiError && <div className="alert alert-error">{apiError}</div>}

          <form onSubmit={handleSubmit}>
            <Field field="name" label="Full Name" placeholder="John Doe" />
            <Field field="email" label="Email address" type="email" placeholder="you@example.com" />
            <Field field="password" label="Password" type="password" placeholder="At least 6 characters" />
            <Field field="confirm" label="Confirm Password" type="password" placeholder="Repeat password" />

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: 20, borderTop: '1px solid var(--grey-border)', paddingTop: 16, textAlign: 'center', fontSize: 14 }}>
            <span style={{ color: 'var(--text-light)' }}>Already have an account? </span>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
