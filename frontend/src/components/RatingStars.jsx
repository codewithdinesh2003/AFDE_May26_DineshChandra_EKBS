import React, { useState } from 'react'

export default function RatingStars({ rating, onRate, readonly = false, size = 20 }) {
  const [hovered, setHovered] = useState(0)

  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star${(hovered || rating || 0) >= star ? ' filled' : ''}`}
          style={{ cursor: readonly ? 'default' : 'pointer', fontSize: size }}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onRate && onRate(star)}
        >
          ★
        </span>
      ))}
    </div>
  )
}
