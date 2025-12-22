// Admin Model
// Handles all admin-related database operations
// NO imports from other models allowed!

import { supabase } from '../config/supabase'
import { corsProxyUpdate } from '../services/corsProxyService'

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
          users!applications_user_id_fkey(full_name, ic_number, email),
          properties(property_type, address, indicative_market_value)
        `)
        .neq('status', 'draft') // Exclude draft applications

      // Apply status filter
      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'pending') {
          // Pending includes both 'submitted' and 'underReviewed'
          query = query.in('status', ['submitted', 'underReviewed'])
        } else {
          // For specific status: submitted, approved, rejected, terminated, underReviewed
          query = query.eq('status', filters.status)
        }
      }

      // Apply sorting
      const sortField = filters.sortBy || 'submitted_at'
      const sortOrder = filters.sortOrder || 'desc'
      query = query.order(sortField, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) throw error

      // Client-side search filter (case-insensitive)
      let filteredData = data || []
      if (filters.search && filters.search.trim()) {
        const searchLower = filters.search.toLowerCase().trim()
        filteredData = data.filter(app => {
          const fullName = (app.users?.full_name || '').toLowerCase()
          const icNumber = (app.users?.ic_number || '').toLowerCase()
          const email = (app.users?.email || '').toLowerCase()
          const address = (app.properties?.address || '').toLowerCase()
          
          return fullName.includes(searchLower) ||
                 icNumber.includes(searchLower) ||
                 email.includes(searchLower) ||
                 address.includes(searchLower)
        })
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
          nominees(*),
          application_data(*)
        `)
        .eq('id', applicationId)
        .single()

      if (error) throw error

      // Extract application_data (comes as array)
      const processedData = {
        ...data,
        application_data: Array.isArray(data.application_data) 
          ? data.application_data[0] 
          : data.application_data
      }

      return { success: true, data: processedData }
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
      const result = await corsProxyUpdate('applications', applicationId, {
          status: 'approved',
          approved_at: new Date().toISOString(),
          remarks: approvalData.remarks || null,
          updated_at: new Date().toISOString()
        })

      if (!result.success) throw new Error(result.error)
      return { success: true, data: result.data }
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
      const result = await corsProxyUpdate('applications', applicationId, {
          status: 'rejected',
          remarks: remarks,
          updated_at: new Date().toISOString()
        })

      if (!result.success) throw new Error(result.error)
      return { success: true, data: result.data }
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
      const updates = {
        status: status,
        remarks: remarks,
        updated_at: new Date().toISOString()
      }

      // Add reviewed_at timestamp when moving to underReviewed status
      if (status === 'underReviewed') {
        updates.reviewed_at = new Date().toISOString()
      }

      const result = await corsProxyUpdate('applications', applicationId, updates)

      if (!result.success) throw new Error(result.error)
      return { success: true, data: result.data }
    } catch (error) {
      console.error('Error updating application status:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get application documents from form data
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Application documents
   */
  async getApplicationDocuments(applicationId) {
    try {
      const { data, error } = await supabase
        .from('application_data')
        .select('form_data')
        .eq('application_id', applicationId)
        .single()

      if (error) throw error

      // Extract document URLs from form_data JSON
      const formData = data?.form_data || {}
      const documents = {
        applicantNRIC: formData.documents?.applicantNRIC || null,
        jointApplicantNRIC: formData.documents?.jointApplicantNRIC || null,
        birthCertificate: formData.documents?.birthCertificate || null,
        marriageCertificate: formData.documents?.marriageCertificate || null,
        payslips: formData.documents?.payslips || [],
        bankStatements: formData.documents?.bankStatements || [],
        epfStatement: formData.documents?.epfStatement || null,
        grantTitle: formData.documents?.grantTitle || null,
        saleAgreement: formData.documents?.saleAgreement || null,
        valuationReport: formData.documents?.valuationReport || null,
        fireInsurance: formData.documents?.fireInsurance || null,
        propertyLoanStatement: formData.documents?.propertyLoanStatement || null,
        additionalDocuments: formData.documents?.additionalDocuments || []
      }

      return { success: true, data: documents }
    } catch (error) {
      console.error('Error fetching application documents:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get application PDF from storage
   * @param {string} applicationId - Application ID
   * @param {string} userId - User ID who owns the application
   * @returns {Promise<Object>} PDF URL and metadata
   */
  async getApplicationPDF(applicationId, userId) {
    try {
      // First get the application to verify userId
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('user_id')
        .eq('id', applicationId)
        .single()

      if (appError) throw appError

      // Use the application's user_id if not provided
      const targetUserId = userId || application.user_id

      if (!targetUserId) {
        throw new Error('User ID not found for this application')
      }

      // Get PDF from application-forms bucket using Application model
      const Application = (await import('./Application')).default
      const result = await Application.downloadApplicationPDF(applicationId, targetUserId)

      if (!result.success) {
        throw new Error(result.error)
      }

      return { 
        success: true, 
        url: result.url,
        fileName: result.fileName,
        size: result.size
      }
    } catch (error) {
      console.error('Error getting application PDF:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Download application PDF directly (opens in new tab)
   * @param {string} applicationId - Application ID
   * @param {string} userId - User ID who owns the application
   * @returns {Promise<Object>} Success/error result
   */
  async downloadApplicationPDFDirect(applicationId, userId) {
    try {
      const result = await this.getApplicationPDF(applicationId, userId)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      // Open in new tab
      window.open(result.url, '_blank')
      
      return { success: true }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get reports (monthly and yearly)
   * @returns {Promise<Array>} Array of generated reports
   */
  async getReports(filters = {}) {
    try {
      // For now, return mock data with monthly and yearly reports
      // In production, this would fetch from a reports table
      const currentYear = new Date().getFullYear()
      const currentMonth = new Date().getMonth()
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      
      const mockReports = []
      
      // Add monthly reports for the last 3 months
      for (let i = 0; i < 3; i++) {
        const monthIndex = (currentMonth - i + 12) % 12
        const year = currentMonth - i < 0 ? currentYear - 1 : currentYear
        
        mockReports.push({
          id: `monthly-${year}-${monthIndex}`,
          name: `Monthly Application Report - ${monthNames[monthIndex]} ${year}`,
          generatedOn: new Date(year, monthIndex, 28).toISOString(),
          type: 'monthly',
          year,
          month: monthIndex
        })
      }
      
      // Add yearly report
      mockReports.push({
        id: `yearly-${currentYear}`,
        name: `Annual Application Analysis Report - ${currentYear}`,
        generatedOn: new Date().toISOString(),
        type: 'yearly',
        year: currentYear
      })

      return { success: true, data: mockReports }
    } catch (error) {
      console.error('Error fetching reports:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Generate yearly report
   * @returns {Promise<Object>} Generated report data
   */
  async generateYearlyReport() {
    try {
      // In production, this would:
      // 1. Fetch all applications for the year
      // 2. Generate statistics
      // 3. Create PDF report
      // 4. Store in reports table
      // 5. Return report metadata
      
      const currentYear = new Date().getFullYear()
      
      // Fetch applications for the year
      const { data: applications, error } = await supabase
        .from('applications')
        .select('*')
        .gte('created_at', `${currentYear}-01-01`)
        .lte('created_at', `${currentYear}-12-31`)
      
      if (error) throw error
      
      // Calculate statistics
      const stats = {
        total: applications.length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        pending: applications.filter(app => app.status === 'submitted' || app.status === 'underReviewed').length,
        year: currentYear
      }
      
      return { 
        success: true, 
        message: 'Yearly report generated successfully',
        data: stats
      }
    } catch (error) {
      console.error('Error generating yearly report:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * View monthly report
   * @param {string} reportId - Report ID
   * @returns {Promise<Object>} Report data
   */
  async viewMonthlyReport(reportId) {
    try {
      // Extract year and month from reportId
      const [, year, month] = reportId.split('-')
      
      // Fetch applications for the month
      const startDate = new Date(parseInt(year), parseInt(month), 1)
      const endDate = new Date(parseInt(year), parseInt(month) + 1, 0)
      
      const { data: applications, error } = await supabase
        .from('applications')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (error) throw error
      
      const stats = {
        total: applications.length,
        approved: applications.filter(app => app.status === 'approved').length,
        rejected: applications.filter(app => app.status === 'rejected').length,
        pending: applications.filter(app => app.status === 'submitted' || app.status === 'underReviewed').length,
        month: parseInt(month),
        year: parseInt(year)
      }
      
      return { success: true, data: stats }
    } catch (error) {
      console.error('Error viewing monthly report:', error)
      return { success: false, error: error.message }
    }
  }
}

export default Admin
