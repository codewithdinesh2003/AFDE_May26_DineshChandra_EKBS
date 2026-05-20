import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { articlesAPI, categoriesAPI, tagsAPI, searchAPI } from '../api/api'
import { useAuth } from '../context/AuthContext'
import ArticleCard from '../components/ArticleCard'
import SearchBar from '../components/SearchBar'
import CategorySidebar from '../components/CategorySidebar'
import TagFilter from '../components/TagFilter'
import Pagination from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'

export default function ArticleList() {
  const { isAuthenticated, isAuthor } = useAuth()
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTag, setSelectedTag] = useState(null)
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 10

  useEffect(() => {
    Promise.all([categoriesAPI.getAll(), tagsAPI.getAll()])
      .then(([catRes, tagRes]) => {
        setCategories(catRes.data.data.categories || [])
        setTags(tagRes.data.data.tags || [])
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page, limit, sort }
    if (selectedCategory) params.category_id = selectedCategory
    if (selectedTag) params.tag = selectedTag
    if (search) params.q = search

    const fetchFn = search
      ? searchAPI.search({ ...params, q: search })
      : articlesAPI.getAll(params)

    Promise.resolve(fetchFn)
      .then(res => {
        const d = res.data.data
        setArticles(d.articles || [])
        setTotal(d.total || d.total_count || 0)
        setTotalPages(d.total_pages || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page, sort, selectedCategory, selectedTag, search])

  const handleSearch = (val) => {
    setSearch(val)
    setPage(1)
  }

  const handleCategorySelect = (id) => {
    setSelectedCategory(id)
    setPage(1)
  }

  const handleTagSelect = (tag) => {
    setSelectedTag(tag)
    setPage(1)
  }

  return (
    <div className="layout-with-sidebar">
      {/* Sidebar */}
      <aside className="sidebar">
        <CategorySidebar
          categories={categories}
          selectedId={selectedCategory}
          onSelect={handleCategorySelect}
        />
        <TagFilter
          tags={tags}
          selectedTag={selectedTag}
          onSelect={handleTagSelect}
        />
      </aside>

      {/* Main content */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <SearchBar value={search} onChange={handleSearch} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--grey-border)', fontSize: 14 }}
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
            </select>
            {isAuthenticated && isAuthor() && (
              <Link to="/articles/new" className="btn btn-primary btn-sm">+ New</Link>
            )}
          </div>
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 12 }}>
          {total} article{total !== 1 ? 's' : ''} found
          {selectedCategory && ` in selected category`}
          {selectedTag && ` tagged "${selectedTag}"`}
          {search && ` matching "${search}"`}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : articles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">No articles found</div>
            {isAuthenticated && isAuthor() && (
              <Link to="/articles/new" className="btn btn-primary" style={{ marginTop: 16 }}>Create the first article</Link>
            )}
          </div>
        ) : (
          <>
            <div className="articles-grid">
              {articles.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
