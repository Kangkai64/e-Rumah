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
      localStorage.removeItem('userRole')
      localStorage.removeItem('applicationStatus')
      return
    }

    // ✅ Fix 2: Set user IMMEDIATELY (before DB queries)
    setUser(authUser)
    
    // ✅ Fix 4: Load cached values first for instant UI
    const cachedRole = localStorage.getItem('userRole')
    const cachedAppStatus = localStorage.getItem('applicationStatus')
    if (cachedRole) setUserRole(cachedRole)
    if (cachedAppStatus) setApplicationStatus(cachedAppStatus)

    try {
      console.log('🔍 Fetching user data for:', authUser.id)
      
      // Fetch user role with 5s timeout
      const userTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('UserTimeout')), 5000)
      )
      
      const fetchPromise = supabase
        .from('users')
        .select('role, type')
        .eq('id', authUser.id)
        .maybeSingle()

      // ✅ Fix 1: Return undefined on timeout (not null)
      const result = await Promise.race([
        fetchPromise,
        userTimeout
      ]).catch(() => {
        return { data: undefined, timedOut: true }
      })

      // ✅ Don't override on timeout - keep cached state
      if (result.timedOut || result.data === undefined) {
        console.log('⏳ User query timed out, keeping cached state')
        return
      }

      const { data: userData } = result

      if (userData) {
        const role = userData.role || 'user'
        setUserRole(role)
        localStorage.setItem('userRole', role)
        console.log('✅ User role loaded:', role)

        // Check application status only for 'user' role
        if (role === 'user') {
          const appTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AppTimeout')), 5000)
          )
          
          const appFetchPromise = supabase
            .from('applications')
            .select('status')
            .eq('user_id', authUser.id)
            .in('status', ['submitted', 'underReviewed', 'approved'])
            .maybeSingle()

          const appResult = await Promise.race([
            appFetchPromise,
            appTimeout
          ]).catch(() => {
            return { data: undefined, timedOut: true }
          })

          // ✅ Don't override on timeout
          if (appResult.timedOut || appResult.data === undefined) {
            console.log('⏳ Application query timed out, keeping cached state')
            return
          }

          const isComplete = appResult.data ? 'complete' : 'incomplete'
          setApplicationStatus(isComplete)
          localStorage.setItem('applicationStatus', isComplete)
          console.log('📊 Application status:', isComplete)
        }
      } else {
        // User record doesn't exist - set defaults and cache them
        console.warn('⚠️ User record not found, using defaults')
        setUserRole('user')
        setApplicationStatus('incomplete')
        localStorage.setItem('userRole', 'user')
        localStorage.setItem('applicationStatus', 'incomplete')
      }
    } catch (error) {
      console.error('❌ Error fetching user data:', error)
      // Don't override - keep whatever state exists
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
      console.log('🔐 Auth event:', event)
      
      if (event === 'SIGNED_IN') {
        // ✅ Only refetch if it's a different user
        if (!user || user.id !== session?.user?.id) {
          console.log('👤 New user signed in, fetching data...')
          await fetchUserData(session?.user ?? null)
        } else {
          console.log('🔁 Same user, skipping refetch')
          setUser(session?.user)
        }
      } else if (event === 'SIGNED_OUT') {
        await fetchUserData(null)
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('🔄 Token refreshed, keeping existing data')
        // Just update user object with fresh token
        if (session?.user) setUser(session.user)
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
