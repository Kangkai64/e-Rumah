// Auth Context Provider
// Manages authentication state globally

import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, onAuthStateChange } from '../../services/authService'
import { supabase } from '../../config/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [applicationStatus, setApplicationStatus] = useState(null) // 'incomplete' or 'complete'
  const [loading, setLoading] = useState(true)

  const fetchUserData = async (authUser) => {
    if (!authUser) {
      setUser(null)
      setUserRole(null)
      setApplicationStatus(null)
      return
    }

    try {
      console.log('🔍 Fetching user data for:', authUser.id)
      
      // Fetch user role from users table with timeout (reduced to 3s)
      const userTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('UserTimeout')), 3000)
      )
      
      const fetchPromise = supabase
        .from('users')
        .select('role, type')
        .eq('id', authUser.id)
        .maybeSingle()

      const { data: userData } = await Promise.race([
        fetchPromise,
        userTimeout
      ]).catch(() => {
        // Silently handle timeout - not an error, just slow query
        return { data: null, error: null }
      })

      // Default to 'user' role (will check application status regardless)
      const role = userData?.role || 'user'
      setUserRole(role)

      if (!userData) {
        console.warn('⚠️ User not found in users table, defaulting to user role')
      } else {
        console.log('✅ User data:', userData)
      }

      // Check if user has completed application (for 'user' role) - with timeout
      if (role === 'user') {
        const appTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AppTimeout')), 3000)
        )
        
        const appFetchPromise = supabase
          .from('applications')
          .select('status')
          .eq('user_id', authUser.id)
          .in('status', ['submitted', 'underReviewed', 'approved'])
          .maybeSingle()

        const result = await Promise.race([
          appFetchPromise,
          appTimeout
        ]).catch((err) => {
          console.log('ℹ️ Timeout checking application status')
          return { data: null, error: err, timedOut: true }
        })

        // Only update status if query succeeded (not timed out)
        if (!result.timedOut) {
          const isComplete = result.data ? 'complete' : 'incomplete'
          console.log('📊 Application status:', isComplete, '- App data:', result.data)
          setApplicationStatus(isComplete)
        } else {
          console.log('⚠️ Keeping existing application status due to timeout')
        }
      }

      setUser(authUser)
    } catch (error) {
      console.error('❌ Error fetching user data:', error)
      // Fallback: set user with default role
      setUserRole('user')
      setApplicationStatus('incomplete')
      setUser(authUser)
    }
  }

  useEffect(() => {
    // Check current session on mount
    const initAuth = async () => {
      try {
        const { user: authUser } = await getCurrentUser()
        await fetchUserData(authUser)
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen to auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      // Only fetch full user data on SIGNED_IN or SIGNED_OUT events
      // Don't refetch on TOKEN_REFRESHED to avoid unnecessary queries
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        await fetchUserData(session?.user ?? null)
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed, keeping existing user data')
      }
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const value = {
    user,
    userRole,
    applicationStatus,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
