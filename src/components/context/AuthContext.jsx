// Auth Context Provider
// Manages authentication state globally

import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChange } from '../../services/authService'
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
      ]).catch((error) => {
        console.warn('⚠️ Timeout or error fetching user data:', error.message)
        // Don't set default values on timeout - keep trying
        return { data: null, error: error }
      })

      // Set role from database, but don't default to 'user' if data is missing
      const role = userData?.role || null  // Keep as null if no data to avoid false assumptions
      setUserRole(role)

      if (!userData) {
        console.warn('⚠️ User not found in users table, role will remain null until data is available')
        // Don't set a default role here - let the UI handle null role state
        return  // Early return to avoid further processing
      } else {
        console.log('✅ User data:', userData, '- Role:', role)
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
      // Don't set fallback values - let the app handle the null state properly
      // This prevents admin users from being treated as regular users
      setUser(authUser)
      // Keep userRole as null to indicate data fetch failure
      console.warn('⚠️ User role could not be determined due to error')
    }
  }

  useEffect(() => {
    // Check current session on mount
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
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
