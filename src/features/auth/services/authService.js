// Authentication service
// This will handle API calls for login, logout, register, etc.

export const authService = {
  login: async (credentials) => {
    // TODO: Implement API call
    console.log('Login attempt:', credentials)
  },
  
  logout: async () => {
    // TODO: Implement API call
    console.log('Logout')
  },
  
  register: async (userData) => {
    // TODO: Implement API call
    console.log('Register:', userData)
  },
  
  getCurrentUser: async () => {
    // TODO: Implement API call
    return null
  }
}
