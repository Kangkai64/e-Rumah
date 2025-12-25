// Protected Route Component
// Redirects based on user authentication and application status

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './sessionController/AuthContext'

export default function ProtectedRoute({ children, requireRole = null }) {
  const { user, userRole, applicationStatus, loading } = useAuth()
  const location = useLocation()

  // Show loading state while authentication is being determined
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

  // Wait for userRole to be determined before making routing decisions
  // This prevents premature redirects while role is being fetched
  if (userRole === null) {
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
        <p>Determining access...</p>
      </div>
    )
  }

  // For regular users, also wait for applicationStatus to be determined
  if (userRole === 'user' && applicationStatus === null) {
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
        <p>Determining access...</p>
      </div>
    )
  }

  // Role-based access control - only redirect if role doesn't match requirement
  if (requireRole && userRole !== requireRole) {
    console.log(`🚫 Access denied. Required: ${requireRole}, Current: ${userRole}`)
    // Redirect to appropriate dashboard based on role
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (userRole === 'support') return <Navigate to="/support/dashboard" replace />
    if (userRole === 'user') {
      // Terminated or complete users go to dashboard, incomplete go to application
      return applicationStatus === 'incomplete' 
        ? <Navigate to="/application" replace />
        : <Navigate to="/user/dashboard" replace />
    }
    // Fallback for unknown roles
    return <Navigate to="/login" replace />
  }

  // For terminated users - block access to /application (they cannot apply again until paid)
  if (userRole === 'user' && applicationStatus === 'terminated' && location.pathname === '/application') {
    console.log('🚫 Terminated user cannot access application form')
    return <Navigate to="/user/application" replace />
  }

  // For regular users with incomplete application (only check for 'user' role)
  if (userRole === 'user' && applicationStatus === 'incomplete') {
    // Only allow access to /application route and landing pages
    if (!location.pathname.startsWith('/application') && 
        location.pathname !== '/' && 
        location.pathname !== '/about') {
      return <Navigate to="/application" replace />
    }
  }

  // For regular users with complete or terminated application trying to access /application
  if (userRole === 'user' && (applicationStatus === 'complete' || applicationStatus === 'terminated') && location.pathname === '/application') {
    return <Navigate to="/user/dashboard" replace />
  }

  return children
}
