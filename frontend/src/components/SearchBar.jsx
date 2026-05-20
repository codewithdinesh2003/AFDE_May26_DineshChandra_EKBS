import React, { useState, useEffect, useRef } from 'react'

export default function SearchBar({ value, onChange, placeholder = 'Search articles...' }) {
  const [localValue, setLocalValue] = useState(value || '')
  const timer = useRef(null)

  useEffect(() => {
    setLocalValue(value || '')
  }, [value])

  const handleChange = (e) => {
    const val = e.target.value
    setLocalValue(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      onChange(val)
    }, 300)
  }

  return (
    <div className="search-bar">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  )
}
