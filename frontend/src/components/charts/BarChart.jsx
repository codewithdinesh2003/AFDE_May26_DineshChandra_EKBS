import React, { useState } from 'react'

export default function BarChart({ data = [], width = 600, height = 220, color = '#2563EB', title = '' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)

  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (!data.length) {
    return (
      <div className="chart-wrapper">
        {title && <div className="chart-title">{title}</div>}
        <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
          No data available
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const barSlot = chartWidth / data.length
  const barWidth = barSlot * 0.7
  const gap = barSlot * 0.3
  const gridLines = 5

  const yScale = (v) => (v / maxValue) * chartHeight

  return (
    <div className="chart-wrapper">
      {title && <div className="chart-title">{title}</div>}
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: width, display: 'block' }}>
        {/* Grid lines */}
        {Array.from({ length: gridLines + 1 }, (_, i) => {
          const yVal = (maxValue / gridLines) * (gridLines - i)
          const y = padding.top + chartHeight - yScale(yVal)
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={padding.left + chartWidth} y2={y}
                stroke="#e2e8f0" strokeWidth="1" />
              <text x={padding.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {Math.round(yVal).toLocaleString()}
              </text>
            </g>
          )
        })}

        {/* Axes */}
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#e2e8f0" />
        <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#e2e8f0" />

        {/* Bars */}
        {data.map((d, i) => {
          const barH = yScale(d.value)
          const x = padding.left + i * barSlot + gap / 2
          const y = padding.top + chartHeight - barH
          const isHovered = hoveredIdx === i
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}>
              <rect x={x} y={y} width={barWidth} height={barH}
                fill={color} opacity={isHovered ? 1 : 0.8} rx={2} />
              <text x={x + barWidth / 2} y={y - 3} textAnchor="middle" fontSize="11" fill="#475569">
                {d.value.toLocaleString()}
              </text>
              <text x={x + barWidth / 2} y={padding.top + chartHeight + 14}
                textAnchor="middle" fontSize="10" fill="#94a3b8">
                {String(d.label).slice(0, 10)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
