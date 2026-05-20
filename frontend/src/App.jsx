import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleRoute from './components/RoleRoute'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ArticleList from './pages/ArticleList'
import ArticleView from './pages/ArticleView'
import ArticleForm from './pages/ArticleForm'
import Search from './pages/Search'
import Categories from './pages/Categories'
import Users from './pages/Users'
import Bookmarks from './pages/Bookmarks'
import MyArticles from './pages/MyArticles'
import ApprovalQueue from './pages/ApprovalQueue'
import Analytics from './pages/Analytics'

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <div className="main-content">
        {children}
      </div>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/articles" replace />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/articles" element={
            <Layout><ArticleList /></Layout>
          } />
          <Route path="/articles/new" element={
            <ProtectedRoute>
              <Layout><ArticleForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/articles/:id" element={
            <Layout><ArticleView /></Layout>
          } />
          <Route path="/articles/:id/edit" element={
            <ProtectedRoute>
              <Layout><ArticleForm /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/search" element={
            <Layout><Search /></Layout>
          } />
          <Route path="/categories" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <Layout><Categories /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin']}>
                <Layout><Users /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/bookmarks" element={
            <ProtectedRoute>
              <Layout><Bookmarks /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/my-articles" element={
            <ProtectedRoute>
              <Layout><MyArticles /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/approval-queue" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin', 'reviewer']}>
                <Layout><ApprovalQueue /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin', 'reviewer']}>
                <Layout><Analytics /></Layout>
              </RoleRoute>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/articles" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
