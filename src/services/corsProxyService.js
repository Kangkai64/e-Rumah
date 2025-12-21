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

/**
 * Update application record via CORS proxy
 * @param {string} applicationId - Application ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export const updateApplication = async (applicationId, updates) => {
  return corsProxyUpdate('applications', applicationId, updates)
}

/**
 * Update nominee record via CORS proxy
 * @param {string} nomineeId - Nominee ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export const updateNominee = async (nomineeId, updates) => {
  return corsProxyUpdate('nominees', nomineeId, updates)
}

/**
 * Update health report record via CORS proxy
 * @param {string} reportId - Health report ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export const updateHealthReport = async (reportId, updates) => {
  return corsProxyUpdate('health_reports', reportId, updates)
}

/**
 * Update user record via CORS proxy
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export const updateUser = async (userId, updates) => {
  return corsProxyUpdate('users', userId, updates)
}

/**
 * Update property record via CORS proxy
 * @param {string} propertyId - Property ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export const updateProperty = async (propertyId, updates) => {
  return corsProxyUpdate('properties', propertyId, updates)
}

/**
 * Update customer support inquiry record via CORS proxy
 * @param {string} inquiryId - Inquiry ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export const updateInquiry = async (inquiryId, updates) => {
  return corsProxyUpdate('customer_support_inquiries', inquiryId, updates)
}

/**
 * Update application_data record via CORS proxy
 * @param {string} applicationDataId - Application data ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export const updateApplicationData = async (applicationDataId, updates) => {
  return corsProxyUpdate('application_data', applicationDataId, updates)
}

/**
 * Update support conversation via CORS proxy
 * @param {string} conversationId - Support conversation ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export const updateSupportConversation = async (conversationId, updates) => {
  return corsProxyUpdate('support_conversations', conversationId, updates)
}

/**
 * Update reminder via CORS proxy
 * @param {string} reminderId - Reminder ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export const updateReminder = async (reminderId, updates) => {
  return corsProxyUpdate('reminders', reminderId, updates)
}

/**
 * Update health report share via CORS proxy
 * @param {string} shareId - Health report share ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 */
export const updateHealthReportShare = async (shareId, updates) => {
  return corsProxyUpdate('health_report_shares', shareId, updates)
}
