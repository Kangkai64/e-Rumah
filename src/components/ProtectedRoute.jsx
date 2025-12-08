// Protected Route Component
// Redirects to login if user is not authenticated

import { Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    // For now, allow access without auth (until auth is fully set up)
    // Uncomment the line below to enforce authentication:
    return <Navigate to="/login" replace />
    
    // Temporary: Allow access for testing
    return children
  }

  return children
}
