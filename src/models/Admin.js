// Admin Model
// Handles all admin-related database operations
// NO imports from other models allowed!

import { supabase } from '../config/supabase'

const Admin = {
  /**
   * Get dashboard statistics
   * @returns {Promise<Object>} Dashboard statistics (pending, approved, rejected counts)
   */
  async getDashboardStats() {
    try {
      // Get count by status
      const { data: applications, error } = await supabase
        .from('applications')
        .select('status')
      
      if (error) throw error

      const stats = {
        pending: applications.filter(app => app.status === 'submitted' || app.status === 'underReviewed').length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        total: applications.length
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all applications with user and property details
   * @param {Object} filters - Filters for status, search query, sort
   * @returns {Promise<Array>} Array of applications with related data
   */
  async getAllApplications(filters = {}) {
    try {
      let query = supabase
        .from('applications')
        .select(`
          *,
          user:users!applications_user_id_fkey(full_name, ic_number, email),
          property:properties(property_type, address, indicative_market_value)
        `)

      // Apply status filter
      if (filters.status) {
        if (filters.status === 'pending') {
          query = query.in('status', ['submitted', 'underReviewed'])
        } else {
          query = query.eq('status', filters.status)
        }
      }

      // Apply search filter (search in user name, property address, IC number)
      if (filters.search) {
        // Note: For complex searches, we'll filter on the client side
        // as Supabase doesn't support nested field searches easily
      }

      // Apply sorting
      const sortField = filters.sortBy || 'submitted_at'
      const sortOrder = filters.sortOrder || 'desc'
      query = query.order(sortField, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error

      // Client-side search filter if needed
      let filteredData = data
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = data.filter(app => 
          app.user?.full_name?.toLowerCase().includes(searchLower) ||
          app.user?.ic_number?.toLowerCase().includes(searchLower) ||
          app.property?.address?.toLowerCase().includes(searchLower)
        )
      }

      return { success: true, data: filteredData }
    } catch (error) {
      console.error('Error fetching applications:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get single application with full details
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Application with all related data
   */
  async getApplicationDetails(applicationId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          user:users!applications_user_id_fkey(full_name, ic_number, email, phone),
          property:properties(*),
          nominees(*)
        `)
        .eq('id', applicationId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching application details:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Approve an application
   * @param {string} applicationId - Application ID
   * @param {Object} approvalData - Approval details
   * @returns {Promise<Object>} Updated application
   */
  async approveApplication(applicationId, approvalData = {}) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          remarks: approvalData.remarks || null,
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
   * Reject an application
   * @param {string} applicationId - Application ID
   * @param {string} remarks - Rejection reason
   * @returns {Promise<Object>} Updated application
   */
  async rejectApplication(applicationId, remarks) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          status: 'rejected',
          remarks: remarks,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error rejecting application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update application status
   * @param {string} applicationId - Application ID
   * @param {string} status - New status
   * @param {string} remarks - Optional remarks
   * @returns {Promise<Object>} Updated application
   */
  async updateApplicationStatus(applicationId, status, remarks = null) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          status: status,
          remarks: remarks,
          updated_at: new Date().toISOString()
        })
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
   * Get reports (stub - to be implemented with actual report logic)
   * @returns {Promise<Array>} Array of generated reports
   */
  async getReports(filters = {}) {
    try {
      // For now, return mock data
      // In production, this would fetch from a reports table
      const mockReports = [
        {
          id: '1',
          name: 'Application Report - Nov 2025',
          generatedOn: '2025-12-01',
          type: 'monthly'
        },
        {
          id: '2',
          name: 'Application Report - OCT 2025',
          generatedOn: '2025-11-28',
          type: 'monthly'
        },
        {
          id: '3',
          name: 'Application Report - Sep 2025',
          generatedOn: '2025-09-30',
          type: 'monthly'
        }
      ]

      return { success: true, data: mockReports }
    } catch (error) {
      console.error('Error fetching reports:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Generate new report (stub)
   * @returns {Promise<Object>} Generated report
   */
  async generateReport() {
    try {
      // Stub for report generation
      // In production, this would generate PDF/Excel reports
      return { success: true, message: 'Report generation initiated' }
    } catch (error) {
      console.error('Error generating report:', error)
      return { success: false, error: error.message }
    }
  }
}

export default Admin
