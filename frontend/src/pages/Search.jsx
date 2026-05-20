import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { searchAPI, categoriesAPI, tagsAPI } from '../api/api'
import ArticleCard from '../components/ArticleCard'
import SearchBar from '../components/SearchBar'
import CategorySidebar from '../components/CategorySidebar'
import TagFilter from '../components/TagFilter'
import Pagination from '../components/Pagination'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const q = searchParams.get('q') || ''
  const categoryId = searchParams.get('category_id') ? Number(searchParams.get('category_id')) : null
  const tag = searchParams.get('tag') || null
  const sort = searchParams.get('sort') || 'latest'
  const page = Number(searchParams.get('page')) || 1
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
    const params = { q, page, limit, sort }
    if (categoryId) params.category_id = categoryId
    if (tag) params.tag = tag

    searchAPI.search(params)
      .then(res => {
        const d = res.data.data
        setArticles(d.articles || [])
        setTotal(d.total_count || 0)
        setTotalPages(d.total_pages || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [q, categoryId, tag, sort, page])

  const update = (key, value) => {
    const params = Object.fromEntries(searchParams.entries())
    if (value) params[key] = String(value)
    else delete params[key]
    params.page = '1'
    setSearchParams(params)
  }

  return (
    <div className="layout-with-sidebar">
      <aside className="sidebar">
        <CategorySidebar
          categories={categories}
          selectedId={categoryId}
          onSelect={id => update('category_id', id)}
        />
        <TagFilter
          tags={tags}
          selectedTag={tag}
          onSelect={t => update('tag', t)}
        />
      </aside>

      <div>
        <div style={{ marginBottom: 20 }}>
          <SearchBar
            value={q}
            onChange={val => update('q', val)}
            placeholder="Search articles by title, content, or tags..."
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--text-light)' }}>
            {q ? (
              <span>{total} result{total !== 1 ? 's' : ''} for <strong>"{q}"</strong></span>
            ) : (
              <span>{total} articles</span>
            )}
          </div>
          <select
            value={sort}
            onChange={e => update('sort', e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--grey-border)', fontSize: 13 }}
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : articles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-text">
              {q ? `No articles found for "${q}"` : 'Enter a search term above'}
            </div>
          </div>
        ) : (
          <>
            <div className="articles-grid">
              {articles.map(a => <ArticleCard key={a.id} article={a} />)}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={p => update('page', p)}
            />
          </>
        )}
      </div>
    </div>
  )
}
