import React, { useEffect } from 'react'

export function ToastItem({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const cls = type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : 'toast-info'

  return (
    <div className={`toast ${cls}`} onClick={onClose} style={{ cursor: 'pointer' }}>
      {message}
    </div>
  )
}

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  )
}

// Hook for toast management
export function useToast() {
  const [toasts, setToasts] = React.useState([])

  const addToast = React.useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}
