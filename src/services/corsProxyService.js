// CORS Proxy Service
// Uses the revoke-share-proxy edge function to safely update database records
// The function enforces allowlist protection for both tables and allowed fields

import { supabase } from '../config/supabase'

/**
 * Call the revoke-share-proxy edge function to update a record
 * @param {string} table - Table name (must be in allowlist)
 * @param {string} id - Record ID
 * @param {Object} patch - Fields to update (only allowed fields per table)
 * @returns {Promise<Object>} Response with success status and data
 */
export const corsProxyUpdate = async (table, id, patch) => {
  try {
    // Get the current session to include auth token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Build headers
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // Add Authorization header if user is authenticated
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    // Call the edge function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/revoke-share-proxy`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          table,
          id,
          patch
        })
      }
    )
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('CORS proxy error:', result)
      throw new Error(result.error || 'Failed to update via proxy')
    }
    
    return result
  } catch (error) {
    console.error('Error calling CORS proxy:', error)
    return { success: false, error: error.message }
  }
}