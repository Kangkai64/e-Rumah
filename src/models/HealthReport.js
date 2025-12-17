// HealthReport Model
// Handles all database operations for health reports
// NO imports from other models allowed!

import { supabase } from '../config/supabase'
import { uploadDocument, deleteDocument } from '../services/fileUploadService'

const HealthReport = {
  /**
   * Create a new health report in the database
   * @param {Object} reportData - The health report data
   * @returns {Promise<Object>} Created health report record
   */
  async create(reportData) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .insert([{
          user_id: reportData.userId,
          application_id: reportData.applicationId || null,
          report_type: reportData.reportType,
          report_date: reportData.reportDate,
          report_file_url: reportData.reportFileUrl,
          notes: reportData.notes
        }])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error creating health report:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get health report by ID
   * @param {string} reportId - The health report ID
   * @returns {Promise<Object>} Health report record
   */
  async getById(reportId) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching health report:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all health reports for a user with filters
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Array of health reports
   */
  async getByUser(userId, filters = {}) {
    try {
      let query = supabase
        .from('health_reports')
        .select('*')
        .eq('user_id', userId)

      // Apply filters
      if (filters.reportType) {
        query = query.eq('report_type', filters.reportType)
      }

      if (filters.applicationId) {
        query = query.eq('application_id', filters.applicationId)
      }

      if (filters.startDate && filters.endDate) {
        query = query.gte('report_date', filters.startDate)
        query = query.lte('report_date', filters.endDate)
      }

      // Apply sorting
      if (filters.sortBy) {
        const order = filters.sortOrder || 'asc'
        query = query.order(filters.sortBy, { ascending: order === 'asc' })
      } else {
        query = query.order('report_date', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching health reports:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Search health reports
   * @param {string} userId - User ID
   * @param {string} searchKey - Search term
   * @returns {Promise<Object>} Array of matching health reports
   */
  async search(userId, searchKey) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .select('*')
        .eq('user_id', userId)
        .or(`report_type.ilike.%${searchKey}%,notes.ilike.%${searchKey}%`)
        .order('report_date', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error searching health reports:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update health report
   * @param {string} reportId - The health report ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated health report record
   */
  async update(reportId, updates) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error updating health report:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete health report
   * @param {string} reportId - The health report ID
   * @returns {Promise<Object>} Success indicator
   */
  async delete(reportId) {
    try {
      // First get the file URL to delete from storage
      const getResult = await this.getById(reportId)

      if (getResult.success && getResult.data.report_file_url) {
        const storageResult = await deleteDocument(
          getResult.data.report_file_url,
          getResult.data.user_id,
          { bucket: 'health-reports' }
        )

        if (storageResult?.error) {
          console.error('Error deleting health report file:', storageResult.error)
        }
      }

      const { error } = await supabase
        .from('health_reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting health report:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Upload health report file to storage
   * @param {string} userId - User ID
   * @param {File} file - File to upload
   * @returns {Promise<Object>} Upload result with file URL
   */
  async uploadFile(userId, file) {
    try {
      const uploadResult = await uploadDocument(
        file,
        userId,
        'health-report',
        { bucket: 'health-reports' }
      )

      if (uploadResult.error) {
        return { success: false, error: uploadResult.error.message || 'Failed to upload file' }
      }

      return {
        success: true,
        data: {
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          uploadedAt: uploadResult.uploadedAt
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get health reports by application ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Health reports
   */
  async getByApplication(applicationId) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .select('*')
        .eq('application_id', applicationId)
        .order('report_date', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching reports by application:', error)
      return { success: false, error: error.message }
    }
  }
}

/**
 * Upload a health report file and create database record
 * @param {string} userId - User ID
 * @param {File} file - File to upload
 * @param {Object} metadata - Report metadata
 * @returns {Promise<Object>} Created health report
 */
export const uploadHealthReport = async (userId, file, metadata = {}) => {
  try {
    const validationResult = validateFile(file)
    if (!validationResult.valid) {
      return { success: false, error: validationResult.error }
    }

    const uploadResult = await HealthReport.uploadFile(userId, file)
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error || 'Failed to upload file' }
    }

    const reportData = {
      userId,
      applicationId: metadata.applicationId,
      reportType: metadata.reportType,
      reportDate: metadata.reportDate,
      reportFileUrl: uploadResult.data.url,
      notes: metadata.notes
    }

    return await HealthReport.create(reportData)
  } catch (error) {
    console.error('Error in uploadHealthReport:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all health reports for a user
 * @param {string} userId - User ID
 * @param {Object} options - Filter, sort, and search options
 * @returns {Promise<Object>} Health reports
 */
export const getHealthReports = async (userId, options = {}) => {
  try {
    if (options.searchKey) {
      return await HealthReport.search(userId, options.searchKey)
    }

    return await HealthReport.getByUser(userId, options)
  } catch (error) {
    console.error('Error in getHealthReports:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check for due and overdue health report alerts
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Alerts list
 */
export const checkHealthReportAlerts = async (userId) => {
  try {
    const result = await HealthReport.getByUser(userId, {
      sortBy: 'report_date',
      sortOrder: 'desc'
    })

    if (!result.success) return result

    const now = new Date()
    const alerts = result.data.reduce((acc, report) => {
      const dueDate = new Date(calculateDueDate(report.report_date, report.report_type))
      const monthsOverdue = (now - dueDate) / (1000 * 60 * 60 * 24 * 30)

      if (monthsOverdue >= 3) {
        acc.push({
          type: 'error',
          message: `Health report due: ${report.report_type} from ${formatDate(new Date(report.report_date))} is overdue (due ${formatDate(dueDate)})`
        })
      } else if (monthsOverdue >= 2) {
        acc.push({
          type: 'warning', 
          message: `Approaching due date: ${report.report_type} is due on ${formatDate(dueDate)}`
        })
      }

      return acc
    }, [])

    return { success: true, data: alerts }
  } catch (error) {
    console.error('Error in checkHealthReportAlerts:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get due and overdue reports within a timeframe
 * @param {string} userId - User ID
 * @param {Object} options - Options (withinDays)
 * @returns {Promise<Object>} Due reports
 */
export const getDueReports = async (userId, options = {}) => {
  const withinDays = options.withinDays ?? 30

  try {
    const result = await HealthReport.getByUser(userId, {
      sortBy: 'report_date',
      sortOrder: 'desc'
    })

    if (!result.success) return result

    const now = new Date()
    const threshold = new Date()
    threshold.setDate(threshold.getDate() + withinDays)

    const dueReports = result.data
      .map((report) => {
        const dueDate = new Date(calculateDueDate(report.report_date, report.report_type))
        const status = dueDate < now ? 'overdue' : 'due'

        return {
          ...report,
          dueDate: dueDate.toISOString(),
          dueDateFormatted: formatDate(dueDate),
          status
        }
      })
      .filter((report) => new Date(report.dueDate) <= threshold)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))

    return { success: true, data: dueReports }
  } catch (error) {
    console.error('Error in getDueReports:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get a single health report by ID
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Health report
 */
export const getHealthReportById = async (reportId) => {
  try {
    return await HealthReport.getById(reportId)
  } catch (error) {
    console.error('Error in getHealthReportById:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a health report
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Success indicator
 */
export const deleteHealthReport = async (reportId) => {
  try {
    return await HealthReport.delete(reportId)
  } catch (error) {
    console.error('Error in deleteHealthReport:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Share a health report
 * @param {string} reportId - Report ID
 * @param {string} shareOption - Share method
 * @param {Object} shareData - Additional share data
 * @returns {Promise<Object>} Share result
 */
export const shareHealthReport = async (reportId, shareOption, shareData) => {
  try {
    const reportResult = await HealthReport.getById(reportId)
    if (!reportResult.success) {
      return reportResult
    }

    const report = reportResult.data

    switch (shareOption) {
      case 'caregiver':
        return await shareWithCaregiver(report, shareData)
      case 'family':
        return await shareWithFamily(report, shareData)
      case 'healthcare':
        return await shareWithHealthcare(report, shareData)
      case 'download':
        return { success: true, action: 'download', url: report.report_file_url }
      case 'link':
        return await generateShareableLink(report, shareData)
      case 'email':
        return await shareViaEmail(report, shareData)
      default:
        return { success: false, error: 'Invalid share option' }
    }
  } catch (error) {
    console.error('Error in shareHealthReport:', error)
    return { success: false, error: error.message }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function validateFile(file) {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

  if (!file) {
    return { valid: false, error: 'No file selected' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' }
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only PDF and JPG files are allowed' }
  }

  return { valid: true }
}

function calculateDueDate(reportDate, reportType) {
  const date = new Date(reportDate)

  let monthsToAdd = 3

  switch (reportType) {
    case 'Medical Report':
      monthsToAdd = 6
      break
    case 'Lab Test':
      monthsToAdd = 3
      break
    case 'Prescription':
      monthsToAdd = 1
      break
    case 'Vaccination Record':
      monthsToAdd = 12
      break
    case "Doctor's Visit Summary":
      monthsToAdd = 3
      break
    default:
      monthsToAdd = 3
  }

  date.setMonth(date.getMonth() + monthsToAdd)
  return date.toISOString()
}

function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

async function shareWithCaregiver(report, shareData) {
  try {
    const { data, error } = await supabase
      .from('health_report_shares')
      .insert([{
        report_id: report.id,
        shared_with_type: 'caregiver',
        shared_with_id: shareData.caregiverId,
        shared_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error

    return { success: true, data, message: 'Report shared with caregiver successfully' }
  } catch (error) {
    console.error('Error sharing with caregiver:', error)
    return { success: false, error: error.message }
  }
}

async function shareWithFamily(report, shareData) {
  try {
    const { data, error } = await supabase
      .from('health_report_shares')
      .insert([{
        report_id: report.id,
        shared_with_type: 'family',
        shared_with_id: shareData.familyMemberId,
        shared_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error

    return { success: true, data, message: 'Report shared with family member successfully' }
  } catch (error) {
    console.error('Error sharing with family:', error)
    return { success: false, error: error.message }
  }
}

async function shareWithHealthcare(report, shareData) {
  try {
    const { data, error } = await supabase
      .from('health_report_shares')
      .insert([{
        report_id: report.id,
        shared_with_type: 'healthcare_provider',
        shared_with_email: shareData.providerEmail,
        shared_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error

    return { success: true, data, message: 'Report shared with healthcare provider successfully' }
  } catch (error) {
    console.error('Error sharing with healthcare provider:', error)
    return { success: false, error: error.message }
  }
}

async function generateShareableLink(report, shareData) {
  try {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (shareData.expiryDays || 7))

    const shareToken = generateToken()

    const { data, error } = await supabase
      .from('health_report_shares')
      .insert([{
        report_id: report.id,
        shared_with_type: 'public_link',
        share_token: shareToken,
        expires_at: expiryDate.toISOString(),
        shared_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error

    const shareUrl = `${window.location.origin}/shared-report/${shareToken}`
    return {
      success: true,
      data: { ...data[0], shareUrl },
      message: 'Shareable link generated successfully'
    }
  } catch (error) {
    console.error('Error generating shareable link:', error)
    return { success: false, error: error.message }
  }
}

async function shareViaEmail(report, shareData) {
  try {
    const { data, error } = await supabase
      .from('health_report_shares')
      .insert([{
        report_id: report.id,
        shared_with_type: 'email',
        shared_with_email: shareData.email,
        shared_at: new Date().toISOString()
      }])
      .select()

    if (error) throw error

    return {
      success: true,
      data,
      message: `Report sent to ${shareData.email} successfully`
    }
  } catch (error) {
    console.error('Error sharing via email:', error)
    return { success: false, error: error.message }
  }
}

function generateToken() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
}

/**
 * Admin function to approve a health report
 * @param {string} reportId - The health report ID
 * @param {string} adminId - The admin user ID
 * @returns {Promise<Object>} Updated health report record
 */
export const approveHealthReport = async (reportId, adminId) => {
  try {
    const { data, error } = await supabase
      .from('health_reports')
      .update({
        status: 'approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data, message: 'Health report approved successfully' }
  } catch (error) {
    console.error('Error approving health report:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Admin function to flag a health report
 * @param {string} reportId - The health report ID
 * @param {string} adminId - The admin user ID
 * @param {string} flagReason - Reason for flagging
 * @returns {Promise<Object>} Updated health report record
 */
export const flagHealthReport = async (reportId, adminId, flagReason) => {
  try {
    if (!flagReason || flagReason.trim().length === 0) {
      return { success: false, error: 'Flag reason is required' }
    }

    const { data, error } = await supabase
      .from('health_reports')
      .update({
        status: 'flagged',
        flag_reason: flagReason.trim(),
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data, message: 'Health report flagged successfully' }
  } catch (error) {
    console.error('Error flagging health report:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Admin function to archive a health report
 * @param {string} reportId - The health report ID
 * @param {string} adminId - The admin user ID
 * @returns {Promise<Object>} Updated health report record
 */
export const archiveHealthReport = async (reportId, adminId) => {
  try {
    const { data, error } = await supabase
      .from('health_reports')
      .update({
        archived: true,
        archived_by: adminId,
        archived_at: new Date().toISOString()
      })
      .eq('id', reportId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data, message: 'Health report archived successfully' }
  } catch (error) {
    console.error('Error archiving health report:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Admin function to get all health reports (for admin dashboard)
 * @param {Object} filters - Filter and search options
 * @returns {Promise<Object>} Array of health reports
 */
export const getAllHealthReports = async (filters = {}) => {
  try {
    let query = supabase
      .from('health_reports')
      .select(`
        *,
        applications(user_id, users(full_name, email))
      `)

    // Apply search filter
    if (filters.searchKey) {
      query = query.or(
        `report_type.ilike.%${filters.searchKey}%,` +
        `notes.ilike.%${filters.searchKey}%,` +
        `applications.users.full_name.ilike.%${filters.searchKey}%,` +
        `applications.users.email.ilike.%${filters.searchKey}%`
      )
    }

    // Apply filters
    if (filters.reportType) {
      query = query.eq('report_type', filters.reportType)
    }

    if (filters.uploadStatus) {
      query = query.eq('status', filters.uploadStatus)
    }

    if (filters.healthcareProvider) {
      query = query.ilike('healthcare_provider', `%${filters.healthcareProvider}%`)
    }

    if (filters.startDate && filters.endDate) {
      query = query.gte('report_date', filters.startDate)
      query = query.lte('report_date', filters.endDate)
    }

    // Apply due status filter
    if (filters.dueStatus) {
      const now = new Date()
      if (filters.dueStatus === 'overdue') {
        // This is complex - we'll handle it in the frontend filtering
      } else if (filters.dueStatus === 'approaching') {
        // This is complex - we'll handle it in the frontend filtering
      }
    }

    // Apply archive filter
    if (filters.showArchived === false) {
      query = query.eq('archived', false)
    }

    // Apply sorting
    if (filters.sortBy) {
      const order = filters.sortOrder || 'desc'
      query = query.order(filters.sortBy, { ascending: order === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) throw error

    // Post-process due status filtering (complex logic)
    let processedData = data
    if (filters.dueStatus) {
      processedData = data.filter(report => {
        const now = new Date()
        const dueDate = new Date(calculateDueDate(report.report_date, report.report_type))
        const monthsOverdue = (now - dueDate) / (1000 * 60 * 60 * 24 * 30)
        
        if (filters.dueStatus === 'overdue') {
          return monthsOverdue >= 3
        } else if (filters.dueStatus === 'approaching') {
          return monthsOverdue >= 2 && monthsOverdue < 3
        }
        return true
      })
    }

    return { success: true, data: processedData }
  } catch (error) {
    console.error('Error fetching all health reports:', error)
    return { success: false, error: error.message }
  }
}

export default HealthReport
