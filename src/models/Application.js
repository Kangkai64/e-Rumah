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
  },

  /**
   * Get application with application_data (form_data JSONB)
   * @param {string} applicationId - The application ID
   * @returns {Promise<Object>} Application record with form_data
   */
  async getByIdWithFormData(applicationId) {
    try {
      // 1. Fetch application from applications table
      const { data: applicationRecord, error: appError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single()

      if (appError) {
        throw new Error(appError.message || 'Failed to fetch application')
      }

      if (!applicationRecord) {
        throw new Error('Application not found')
      }

      // 2. Fetch application_data with form_data (JSONB)
      const { data: applicationDataRecord, error: dataError } = await supabase
        .from('application_data')
        .select('*')
        .eq('application_id', applicationId)
        .single()

      if (dataError) {
        console.error('Error fetching application data:', dataError)
        // If application_data doesn't exist, return with empty form_data
        return {
          success: true,
          data: {
            ...applicationRecord,
            submitted_form_data: {},
            current_step: null
          }
        }
      }

      // 3. Combine application and form_data
      const combinedData = {
        ...applicationRecord,
        submitted_form_data: applicationDataRecord.form_data || {},
        current_step: applicationDataRecord.current_step
      }

      return { success: true, data: combinedData }
    } catch (error) {
      console.error('Error fetching application with form data:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Verify user owns the application
   * @param {Object} applicationRecord - Application record
   * @param {string} userId - User ID to verify
   * @returns {boolean} True if user owns the application
   */
  verifyOwnership(applicationRecord, userId) {
    if (!applicationRecord || !userId) {
      return false
    }
    return applicationRecord.user_id === userId
  },

  /**
   * Transform form data for view display
   * @param {Object} formData - Raw form data from database
   * @returns {Object} Transformed form data
   */
  transformFormData(formData) {
    if (!formData) return {}

    // Transform nominee data from form fields to array format
    const nominees = []
    if (formData.nominee1Name && formData.nominee1Ic) {
      nominees.push({
        name: formData.nominee1Name,
        nric: formData.nominee1Ic,
        relationship: formData.nominee1Relationship || '-'
      })
    }
    if (formData.nominee2Name && formData.nominee2Ic) {
      nominees.push({
        name: formData.nominee2Name,
        nric: formData.nominee2Ic,
        relationship: formData.nominee2Relationship || '-'
      })
    }

    // Transform form data to match view expectations
    const transformed = {
      ...formData,
      // Calculate age if not present
      age: formData.age || this.calculateAge(formData.dobDay, formData.dobMonth, formData.dobYear),
      // Calculate joint applicant age if not present
      jAge: formData.jAge || (formData.isJointApplicant ? this.calculateAge(formData.jDobDay, formData.jDobMonth, formData.jDobYear) : undefined),
      // Map property value fields
      propertyValue: formData.propertyValue || formData.expectedMarketValue || formData.indicativeMarketValue,
      // Calculate ownership duration
      ownershipDuration: formData.ownershipDuration || this.calculateOwnershipDuration(
        formData.purchaseDay,
        formData.purchaseMonth,
        formData.purchaseYear
      ),
      // Add nominees array
      nominees: nominees.length > 0 ? nominees : undefined
    }

    return transformed
  },

  /**
   * Calculate age from date of birth
   * @param {string} dobDay - Day of birth
   * @param {string} dobMonth - Month of birth
   * @param {string} dobYear - Year of birth
   * @returns {string|null} Age in format "XX years" or null
   */
  calculateAge(dobDay, dobMonth, dobYear) {
    if (!dobDay || !dobMonth || !dobYear) return null
    const birthDate = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay))
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} years`
  },

  /**
   * Calculate ownership duration from purchase date
   * @param {string} purchaseDay - Day of purchase
   * @param {string} purchaseMonth - Month of purchase
   * @param {string} purchaseYear - Year of purchase
   * @returns {string|null} Ownership duration in years or null
   */
  calculateOwnershipDuration(purchaseDay, purchaseMonth, purchaseYear) {
    if (!purchaseDay || !purchaseMonth || !purchaseYear) return null
    const purchaseDate = new Date(parseInt(purchaseYear), parseInt(purchaseMonth) - 1, parseInt(purchaseDay))
    const today = new Date()
    let years = today.getFullYear() - purchaseDate.getFullYear()
    const monthDiff = today.getMonth() - purchaseDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < purchaseDate.getDate())) {
      years--
    }
    return `${years}`
  },

  /**
   * Extract approved amount from form data
   * @param {Object} formData - Form data
   * @returns {number} Approved amount or 0
   */
  extractApprovedAmount(formData) {
    if (!formData) return 0
    const approvedAmountValue =
      formData.approvedAmount ||
      formData.monthlyPayout ||
      formData.expectedMarketValue ||
      0
    return parseFloat(approvedAmountValue) || 0
  },

  /**
   * Build timeline from application data
   * @param {Object} appData - Application data
   * @returns {Array} Array of timeline events
   */
  buildTimeline(appData) {
    if (!appData) return []

    const events = []

    // Application submitted (always show if exists)
    if (appData.submitted_at) {
      events.push({
        date: appData.submitted_at,
        title: 'Application Submitted',
        status: 'completed'
      })
    }

    // Application approved (only show if approved)
    if (appData.status === 'approved') {
      if (appData.approved_at) {
        events.push({
          date: appData.approved_at,
          title: 'Application Approved',
          status: 'completed'
        })
      } else if (appData.updated_at) {
        // Fallback to updated_at if approved_at is not set
        events.push({
          date: appData.updated_at,
          title: 'Application Approved',
          status: 'completed'
        })
      }

      // Payment started (only for approved applications)
      const paymentDate = appData.approved_at || appData.updated_at || new Date().toISOString()
      events.push({
        date: paymentDate,
        title: 'Payment Started',
        status: 'completed'
      })
    }

    // Sort events by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date))

    return events
  },

  /**
   * Get complete application details for maintain view
   * Includes fetching, ownership verification, and data transformation
   * @param {string} applicationId - The application ID
   * @param {string} userId - User ID for ownership verification
   * @returns {Promise<Object>} Complete application data with transformed form data and timeline
   */
  async getMaintainApplicationDetails(applicationId, userId) {
    try {
      // 1. Fetch application with form data
      const result = await this.getByIdWithFormData(applicationId)
      
      if (!result.success) {
        return result
      }

      const applicationRecord = result.data

      // 2. Verify user owns this application
      if (!this.verifyOwnership(applicationRecord, userId)) {
        return {
          success: false,
          error: 'You do not have permission to view this application'
        }
      }

      // 3. Transform form data
      const formData = applicationRecord.submitted_form_data || {}
      const transformedFormData = this.transformFormData(formData)

      // 4. Build combined application data
      const appData = {
        ...applicationRecord,
        submitted_form_data: transformedFormData
      }

      // 5. Extract approved amount
      const approvedAmount = this.extractApprovedAmount(formData)

      // 6. Build timeline
      const timeline = this.buildTimeline(appData)

      return {
        success: true,
        data: {
          application: appData,
          status: appData.status,
          approvedAmount,
          timeline
        }
      }
    } catch (error) {
      console.error('Error getting maintain application details:', error)
      return { success: false, error: error.message }
    }
  }
}

export default Application
