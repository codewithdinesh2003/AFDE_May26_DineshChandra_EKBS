import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        try {
          const res = await authAPI.getMe()
          if (res.data.success) {
            setUser(res.data.data)
            setToken(savedToken)
          } else {
            logout()
          }
        } catch {
          logout()
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data.data
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      return { success: true }
    }
    return { success: false, message: res.data.message }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }))
  }

  const isAdmin = () => user?.role === 'admin'
  const isAuthor = () => user?.role === 'author' || user?.role === 'admin'
  const isReviewer = () => user?.role === 'reviewer' || user?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      login,
      logout,
      updateUser,
      isAdmin,
      isAuthor,
      isReviewer,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
