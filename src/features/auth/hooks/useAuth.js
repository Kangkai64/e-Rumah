import { useState, useEffect } from 'react'
import { authService } from '../services/authService'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check if user is logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      setUser(user)
      setIsLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const login = async (credentials) => {
    try {
      setError(null)
      setIsLoading(true)
      const user = await authService.login(credentials)
      setUser(user)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await authService.logout()
      setUser(null)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      setIsLoading(true)
      const user = await authService.register(userData)
      setUser(user)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    user,
    isLoading,
    error,
    login,
    logout,
    register,
    isAuthenticated: !!user
  }
}
