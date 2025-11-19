import { supabase } from '../../../shared/config/supabase'

// Authentication service
// Handles all auth-related API calls using Supabase

export const authService = {
  // Login with email and password
  login: async (credentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    })
    
    if (error) throw error
    return data.user
  },
  
  // Logout current user
  logout: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  
  // Register new user
  register: async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
          ic_number: userData.icNumber,
        }
      }
    })
    
    if (error) throw error
    return data.user
  },
  
  // Get current logged-in user
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },
  
  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null)
    })
  }
}
