import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location  = useLocation()

  // Check both React state AND localStorage — covers the case where
  // login() sets localStorage before React re-renders with the new state
  const token    = localStorage.getItem('nn_admin_token')
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('nn_admin_user')) } catch { return null }
  })()

  const isAuthenticated = !!(user || (token && storedUser))

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
