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
      
      // Fetch user role from users table with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )
      
      const fetchPromise = supabase
        .from('users')
        .select('role, type')
        .eq('id', authUser.id)
        .maybeSingle() // Use maybeSingle instead of single to avoid error if not found

      const { data: userData, error: userError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]).catch(err => {
        console.error('⏱️ Timeout or error fetching user:', err)
        return { data: null, error: err }
      })

      if (userError) {
        console.error('❌ User data fetch error:', userError.message)
        // If user doesn't exist in users table, default to 'user' role
        setUserRole('user')
        setApplicationStatus('incomplete')
        setUser(authUser)
        return
      }

      if (userData) {
        console.log('✅ User data:', userData)
        // Default to 'user' role if role column doesn't exist or is null
        const role = userData.role || 'user'
        setUserRole(role)

        // Check if user has completed application (only for 'user' role)
        if (role === 'user') {
          const { data: appData, error: appError } = await supabase
            .from('applications')
            .select('status')
            .eq('user_id', authUser.id)
            .in('status', ['submitted', 'underReviewed', 'approved'])
            .maybeSingle()

          if (appError) {
            console.log('ℹ️ No completed application found:', appError.message)
          }

          setApplicationStatus(appData ? 'complete' : 'incomplete')
        }
      } else {
        // User not in database table, default to 'user' role
        console.warn('⚠️ User not found in users table, defaulting to user role')
        setUserRole('user')
        setApplicationStatus('incomplete')
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
      await fetchUserData(session?.user ?? null)
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
