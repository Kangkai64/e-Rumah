// Protected Route Component
// Redirects based on user authentication and application status

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

export default function ProtectedRoute({ children, requireRole = null }) {
  const { user, userRole, applicationStatus, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // Role-based access control
  if (requireRole && userRole !== requireRole) {
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (userRole === 'support') return <Navigate to="/support/dashboard" replace />
    if (userRole === 'user') {
      return applicationStatus === 'incomplete' 
        ? <Navigate to="/application" replace />
        : <Navigate to="/user/dashboard" replace />
    }
  }

  // For regular users with incomplete application
  if (userRole === 'user' && applicationStatus === 'incomplete') {
    // Only allow access to /application route
    if (!location.pathname.startsWith('/application')) {
      return <Navigate to="/application" replace />
    }
  }

  return children
}
