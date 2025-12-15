// Application Model
// Handles all database operations for applications
// NO imports from other models allowed!

import { supabase } from '../config/supabase'

const Application = {
  /**
   * Create a new application in the database
   * @param {Object} applicationData - The application form data
   * @returns {Promise<Object>} Created application record
   */
  async create(applicationData) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          user_id: applicationData.userId,
          property_id: applicationData.propertyId,
          nominee_ids: applicationData.nomineeIds || [],
          health_report_id: applicationData.healthReportId,
          submitted_form_data: applicationData.formData,
          status: 'pending',
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error creating application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get application by ID
   * @param {string} applicationId - The application ID
   * @returns {Promise<Object>} Application record
   */
  async getById(applicationId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all applications for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of applications
   */
  async getByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching user applications:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update application status
   * @param {string} applicationId - The application ID
   * @param {string} status - New status (pending, approved, rejected)
   * @returns {Promise<Object>} Updated application
   */
  async updateStatus(applicationId, status) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error updating application status:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update application with approval details
   * @param {string} applicationId - The application ID
   * @param {Object} approvalData - Approval data (monthly amount, total amount, admin notes)
   * @returns {Promise<Object>} Updated application
   */
  async approve(applicationId, approvalData) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          status: 'approved',
          approved_monthly_amount: approvalData.monthlyAmount,
          approved_total_amount: approvalData.totalAmount,
          approved_at: new Date().toISOString(),
          admin_notes: approvalData.adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error approving application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete application
   * @param {string} applicationId - The application ID
   * @returns {Promise<Object>} Deletion result
   */
  async delete(applicationId) {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all applications (admin function)
   * @param {Object} filters - Optional filters (status, dateRange)
   * @returns {Promise<Array>} Array of all applications
   */
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('applications')
        .select('*')
        .order('submitted_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.dateFrom) {
        query = query.gte('submitted_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('submitted_at', filters.dateTo)
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching all applications:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Save draft application to localStorage
   * @param {Object} formData - The form data to save
   */
  saveDraft(formData) {
    try {
      localStorage.setItem('ssbFormData', JSON.stringify(formData))
      return { success: true }
    } catch (error) {
      console.error('Error saving draft:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Load draft application from localStorage
   * @returns {Object|null} Saved form data or null
   */
  loadDraft() {
    try {
      const saved = localStorage.getItem('ssbFormData')
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Error loading draft:', error)
      return null
    }
  },

  /**
   * Clear draft from localStorage
   */
  clearDraft() {
    try {
      localStorage.removeItem('ssbFormData')
      localStorage.removeItem('ssbCurrentStep')
      return { success: true }
    } catch (error) {
      console.error('Error clearing draft:', error)
      return { success: false, error: error.message }
    }
  }
}

export default Application
