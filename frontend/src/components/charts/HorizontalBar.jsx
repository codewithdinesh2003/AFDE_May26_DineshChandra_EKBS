import React, { useEffect, useState } from 'react'

export default function HorizontalBar({ data = [], title = '', showTotal = true }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50)
    return () => clearTimeout(t)
  }, [])

  if (!data.length) {
    return (
      <div>
        {title && <div className="chart-title">{title}</div>}
        <div style={{ color: '#94a3b8', fontSize: 13, padding: '16px 0' }}>No data available</div>
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.value, 0) || 1

  return (
    <div>
      {title && <div className="chart-title">{title}</div>}
      {data.map((d, i) => {
        const pct = Math.round((d.value / total) * 100)
        return (
          <div key={i} className="hbar-row">
            <span className="hbar-label" title={d.label}>{d.label}</span>
            <div className="hbar-track">
              <div
                className="hbar-fill"
                style={{
                  width: animated ? `${pct}%` : '0%',
                  backgroundColor: d.color || '#2563EB',
                }}
              />
            </div>
            <span className="hbar-value">
              {d.value.toLocaleString()}
              {showTotal && ` (${pct}%)`}
            </span>
          </div>
        )
      })}
    </div>
  )
}
