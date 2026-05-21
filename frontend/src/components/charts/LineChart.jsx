import React, { useState } from 'react'

export default function LineChart({ data = [], width = 600, height = 220, color = '#2563EB', title = '' }) {
  const [tooltip, setTooltip] = useState(null)

  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  if (!data.length) {
    return (
      <div className="chart-wrapper">
        {title && <div className="chart-title">{title}</div>}
        <div style={{ height: height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
          No data available
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value), 1)
  const minValue = 0

  const xStep = chartWidth / Math.max(data.length - 1, 1)
  const yScale = (v) => chartHeight - ((v - minValue) / (maxValue - minValue)) * chartHeight

  const points = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + yScale(d.value),
    label: d.label,
    value: d.value,
  }))

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ')

  const gridLines = 5
  const showEveryN = Math.ceil(data.length / 12)

  return (
    <div className="chart-wrapper">
      {title && <div className="chart-title">{title}</div>}
      <div style={{ position: 'relative', display: 'inline-block', width: '100%', maxWidth: width }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', maxWidth: width, display: 'block' }}>
          {/* Grid lines */}
          {Array.from({ length: gridLines + 1 }, (_, i) => {
            const yVal = (maxValue / gridLines) * (gridLines - i)
            const y = padding.top + yScale(yVal)
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

          {/* X-axis labels */}
          {points.map((p, i) => (
            i % showEveryN === 0 && (
              <text key={i} x={p.x} y={height - padding.bottom + 16}
                textAnchor="middle" fontSize="10" fill="#94a3b8">
                {String(p.label).slice(-5)}
              </text>
            )
          ))}

          {/* Axes */}
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#e2e8f0" />
          <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#e2e8f0" />

          {/* Line */}
          <polyline points={polylinePoints} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

          {/* Points */}
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={4} fill={color}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ x: p.x, y: p.y, label: p.label, value: p.value })}
              onMouseLeave={() => setTooltip(null)} />
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: 'absolute',
            left: `calc(${(tooltip.x / width) * 100}% + 8px)`,
            top: `calc(${(tooltip.y / height) * 100}% - 28px)`,
            background: '#1e293b', color: 'white', borderRadius: 4,
            padding: '4px 8px', fontSize: 11, pointerEvents: 'none',
            whiteSpace: 'nowrap', zIndex: 10,
          }}>
            {tooltip.label}: {tooltip.value.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
