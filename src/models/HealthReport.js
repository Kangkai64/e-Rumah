// HealthReport Model
// Handles all database operations for health reports
// NO imports from other models allowed!

import { supabase } from '../config/supabase'
import { corsProxyUpdate } from '../services/corsProxyService'
import { uploadDocument, deleteDocument } from '../services/fileUploadService'
import { sendHealthReportShareEmail } from '../services/emailService'

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
          report_title: reportData.reportTitle,
          report_file_url: reportData.reportFileUrl,
          notes: reportData.notes,
          health_report_status: reportData.healthReportStatus || 'Pending',
          due_status: reportData.dueStatus || 'Up to Date'
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
        .or(`report_type.ilike.%${searchKey}%,notes.ilike.%${searchKey}%,report_title.ilike.%${searchKey}%`)
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
      const result = await corsProxyUpdate('health_reports', reportId, updates)

      if (!result.success) throw new Error(result.error)
      return { success: true, data: result.data }
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
  },

  /**
   * Get all flagged health reports (for support staff workspace)
   * @returns {Promise<Object>} { success, data }
   */
  async getFlagged() {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .select(`
          *,
          user:users!health_reports_user_id_fkey (
            id,
            full_name,
            email,
            phone,
            ic_number
          )
        `)
        .eq('health_report_status', 'Flagged')
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching flagged health reports:', error)
      return { success: false, error: error.message, data: [] }
    }
  },

  /**
   * Update health report status
   * @param {string} reportId - Health report ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated health report
   */
  async updateStatus(reportId, status) {
    try {
      const result = await corsProxyUpdate('health_reports', reportId, {
        health_report_status: status,
        updated_at: new Date().toISOString()
      })

      if (!result.success) throw new Error(result.error)
      return { success: true, data: result.data }
    } catch (error) {
      console.error('Error updating health report status:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update due status
   * @param {string} reportId - Health report ID
   * @param {string} dueStatus - New due status
   * @returns {Promise<Object>} Updated health report
   */
  async updateDueStatus(reportId, dueStatus) {
    try {
      const result = await corsProxyUpdate('health_reports', reportId, {
        due_status: dueStatus,
        updated_at: new Date().toISOString()
      })

      if (!result.success) throw new Error(result.error)
      return { success: true, data: result.data }
    } catch (error) {
      console.error('Error updating due status:', error)
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
      reportTitle: metadata.reportTitle,
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
    const alerts = result.data
      .filter(report => report.health_report_status !== 'Archived') // Exclude archived reports
      .reduce((acc, report) => {
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
      .filter((report) => report.health_report_status !== 'Archived') // Exclude archived reports
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
        return await downloadHealthReportFile(report)
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

async function downloadHealthReportFile(report) {
  try {
    // Extract file extension from URL
    const url = report.report_file_url
    const urlParts = url.split('.')
    const extension = urlParts.length > 1 ? `.${urlParts.pop()}` : ''
    
    // Create filename with proper extension
    const filename = `${report.report_title || 'health-report'}${extension}`
    
    // Try to fetch and download the file directly
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch file')
    
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up the blob URL
    setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100)
    
    return { success: true, action: 'downloaded', message: 'File downloaded successfully' }
  } catch (error) {
    console.error('Direct download failed:', error)
    // Fallback to returning URL for manual download
    return { success: true, action: 'download', url: report.report_file_url, message: 'Please click the link to download' }
  }
}

/**
 * Helper function to send share notification email
 * @param {Object} report - The health report being shared
 * @param {string} recipientEmail - Recipient's email address
 * @param {string} shareToken - The share token for generating URL
 * @param {Date} expiryDate - When the share expires
 * @param {string} shareType - Type of share (caregiver, family, etc.)
 * @param {string} recipientId - Optional recipient user ID for getting name
 */
async function sendShareNotificationEmail(report, recipientEmail, shareToken, expiryDate, shareType, recipientId = null) {
  try {
    // Get sender information
    const { data: senderData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', report.user_id)
      .single()

    // Get recipient name if recipientId provided
    let recipientName = null
    if (recipientId) {
      const { data: recipientData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', recipientId)
        .single()
      recipientName = recipientData?.full_name
    }

    // Send email notification
    const shareUrl = `${window.location.origin}/shared-report/${shareToken}`
    const emailResult = await sendHealthReportShareEmail({
      recipientEmail: recipientEmail,
      recipientName: recipientName,
      senderName: senderData?.full_name || 'A user',
      reportTitle: report.report_title || 'Health Report',
      reportType: report.report_type || 'Health Report',
      shareUrl: shareUrl,
      expiryDate: expiryDate.toISOString(),
      shareType: shareType
    })

    if (!emailResult.success) {
      console.warn('Share successful but email notification failed:', emailResult.error)
    }
  } catch (error) {
    console.warn('Failed to send share notification email:', error)
  }
}

async function shareWithCaregiver(report, shareData) {
  try {
    // Validate required fields
    if (!shareData || !shareData.email || shareData.email.trim() === '') {
      return { success: false, error: 'Email address is required for sharing with caregiver' }
    }

    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', shareData.email.trim())
      .maybeSingle()

    if (userError || !userData) {
      return { success: false, error: 'No user found with the provided email address' }
    }

    // Then, check if this user is a caregiver
    const { data: caregiverData, error: caregiverError } = await supabase
      .from('caregivers')
      .select('id, user_id')
      .eq('user_id', userData.id)
      .maybeSingle()

    if (caregiverError || !caregiverData) {
      return { success: false, error: 'User found but they are not registered as a caregiver' }
    }

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (shareData.expiryDays || 7))

    // Generate share token (required by DB)
    const shareToken = generateToken()

    const { data, error } = await supabase
      .from('health_report_shares')
      .insert([{
        report_id: report.id,
        shared_by_user_id: report.user_id,
        shared_with_type: 'caregiver',
        shared_with_id: caregiverData.user_id,
        shared_with_email: shareData.email.trim(),
        share_token: shareToken,
        expires_at: expiryDate.toISOString()
      }])
      .select()

    if (error) throw error

    // Send email notification
    await sendShareNotificationEmail(
      report,
      shareData.email.trim(),
      shareToken,
      expiryDate,
      'caregiver',
      caregiverData.user_id
    )

    return { success: true, data, message: 'Report shared with caregiver successfully' }
  } catch (error) {
    console.error('Error sharing with caregiver:', error)
    return { success: false, error: error.message }
  }
}

async function shareWithFamily(report, shareData) {
  try {
    // Validate required fields
    if (!shareData || !shareData.email || shareData.email.trim() === '') {
      return { success: false, error: 'Email address is required for sharing with family member' }
    }

    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', shareData.email.trim())
      .maybeSingle()

    if (userError || !userData) {
      return { success: false, error: 'No user found with the provided email address' }
    }

    // Then, check if there's a verified family relationship
    const { data: familyData, error: familyError } = await supabase
      .from('family_members')
      .select('id, family_member_user_id, permissions_level, is_verified')
      .eq('user_id', report.user_id)
      .eq('family_member_user_id', userData.id)
      .eq('is_verified', true)
      .maybeSingle()

    if (familyError || !familyData) {
      return { success: false, error: 'No verified family member relationship found with this user' }
    }

    // Check permissions
    if (!['view_and_share', 'full'].includes(familyData.permissions_level)) {
      return { success: false, error: 'Family member does not have permission to view reports' }
    }

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (shareData.expiryDays || 7))

    // Generate share token (required by DB)
    const shareToken = generateToken()

    const { data, error } = await supabase
      .from('health_report_shares')
      .insert([{
        report_id: report.id,
        shared_by_user_id: report.user_id,
        shared_with_type: 'family',
        shared_with_id: familyData.family_member_user_id,
        shared_with_email: shareData.email.trim(),
        share_token: shareToken,
        expires_at: expiryDate.toISOString()
      }])
      .select()

    if (error) throw error

    // Send email notification
    await sendShareNotificationEmail(
      report,
      shareData.email.trim(),
      shareToken,
      expiryDate,
      'family member',
      familyData.family_member_user_id
    )

    return { success: true, data, message: 'Report shared with family member successfully' }
  } catch (error) {
    console.error('Error sharing with family:', error)
    return { success: false, error: error.message }
  }
}

async function shareWithHealthcare(report, shareData) {
  try {
    // Validate required fields
    if (!shareData || !shareData.email || shareData.email.trim() === '') {
      return { success: false, error: 'Email address is required for sharing with healthcare provider' }
    }

    // First, find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', shareData.email.trim())
      .maybeSingle()

    if (userError || !userData) {
      return { success: false, error: 'No user found with the provided email address' }
    }

    // Then, check if this user is a verified healthcare provider
    const { data: providerData, error: providerError } = await supabase
      .from('healthcare_providers')
      .select('id, user_id, is_verified')
      .eq('user_id', userData.id)
      .eq('is_verified', true)
      .maybeSingle()

    if (providerError || !providerData) {
      return { success: false, error: 'User found but they are not a verified healthcare provider' }
    }

    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (shareData.expiryDays || 7))

    // Generate share token (required by DB)
    const shareToken = generateToken()

    const { data, error } = await supabase
      .from('health_report_shares')
      .insert([{
        report_id: report.id,
        shared_by_user_id: report.user_id,
        shared_with_type: 'healthcare_provider',
        shared_with_id: providerData.user_id,
        shared_with_email: shareData.email.trim(),
        share_token: shareToken,
        expires_at: expiryDate.toISOString()
      }])
      .select()

    if (error) throw error

    // Send email notification
    await sendShareNotificationEmail(
      report,
      shareData.email.trim(),
      shareToken,
      expiryDate,
      'healthcare provider',
      providerData.user_id
    )

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
        shared_by_user_id: report.user_id,
        shared_with_type: 'link',
        share_token: shareToken,
        expires_at: expiryDate.toISOString()
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
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + (shareData.expiryDays || 7))

    const shareToken = generateToken()

    const { data, error } = await supabase
      .from('health_report_shares')
      .insert([{
        report_id: report.id,
        shared_by_user_id: report.user_id,
        shared_with_type: 'email',
        shared_with_email: shareData.email,
        share_token: shareToken,
        expires_at: expiryDate.toISOString()
      }])
      .select()

    if (error) throw error

    const shareUrl = `${window.location.origin}/shared-report/${shareToken}`

    // Send email notification
    await sendShareNotificationEmail(
      report,
      shareData.email,
      shareToken,
      expiryDate,
      'email'
    )

    return {
      success: true,
      data: { ...data[0], shareUrl },
      message: `Report shared with ${shareData.email} successfully`
    }
  } catch (error) {
    console.error('Error sharing via email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all share links for a health report
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Share records
 */
export const getHealthReportShares = async (reportId) => {
  try {
    const { data, error } = await supabase
      .from('health_report_shares')
      .select('*')
      .eq('report_id', reportId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching health report shares:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Revoke a shared health report link
 * @param {string} shareId - Share record ID
 * @returns {Promise<Object>} Updated share record
 */
export const revokeHealthReportShare = async (shareId) => {
  try {
    const timestamp = new Date().toISOString()

    const result = await corsProxyUpdate('health_report_shares', shareId, {
      is_revoked: true,
      expires_at: timestamp,
      updated_at: timestamp
    })

    if (!result.success) throw new Error(result.error)
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error revoking health report share:', error)
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
    const result = await corsProxyUpdate('health_reports', reportId, {
      health_report_status: 'Reviewed',
      updated_at: new Date().toISOString(),
      notes: `Reviewed by admin ${adminId} on ${new Date().toLocaleDateString()}`
    })

    if (!result.success) throw new Error(result.error)
    return { success: true, data: result.data, message: 'Health report approved successfully' }
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
    const result = await corsProxyUpdate('health_reports', reportId, {
      health_report_status: 'Flagged',
      updated_at: new Date().toISOString(),
      flagged_reason: flagReason.trim(),
      notes: `Flagged by admin ${adminId} on ${new Date().toLocaleDateString()}: ${flagReason.trim()}`
    })

    if (!result.success) throw new Error(result.error)
    return { success: true, data: result.data, message: 'Health report flagged successfully' }
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
    const result = await corsProxyUpdate('health_reports', reportId, {
      health_report_status: 'Archived',
      updated_at: new Date().toISOString(),
      notes: `Archived by admin ${adminId} on ${new Date().toLocaleDateString()}`
    })

    if (!result.success) throw new Error(result.error)
    return { success: true, data: result.data, message: 'Health report archived successfully' }
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
    // Use admin view to include flattened user details for easier searching
    let query = supabase
      .from('admin_health_report_view')
      .select('*')

    // Apply search filter across report and user fields
    const rawSearchKey = filters.searchKey?.trim()
    if (rawSearchKey) {
      const safeSearch = rawSearchKey.replace(/,/g, ' ')
      query = query.or(
        `report_type.ilike.%${safeSearch}%,` +
        `report_title.ilike.%${safeSearch}%,` +
        `notes.ilike.%${safeSearch}%,` +
        `user_full_name.ilike.%${safeSearch}%,` +
        `user_email.ilike.%${safeSearch}%,` +
        `ic_number.ilike.%${safeSearch}%,` +
        `phone.ilike.%${safeSearch}%`
      )
    }

    // Apply filters
    if (filters.reportType) {
      query = query.eq('report_type', filters.reportType)
    }

    if (filters.uploadStatus) {
      query = query.eq('health_report_status', filters.uploadStatus)
    }

    if (filters.startDate && filters.endDate) {
      query = query.gte('report_date', filters.startDate)
      query = query.lte('report_date', filters.endDate)
    }

    // Apply archive filter - show only non-archived reports unless specifically requested
    if (filters.showArchived === false) {
      query = query.neq('health_report_status', 'Archived')
    }

    // Apply sorting (map legacy keys to view columns for compatibility)
    const sortColumnMap = {
      id: 'health_report_id',
      created_at: 'report_created_at'
    }
    if (filters.sortBy) {
      const sortColumn = sortColumnMap[filters.sortBy] || filters.sortBy
      const order = filters.sortOrder || 'desc'
      query = query.order(sortColumn, { ascending: order === 'asc' })
    } else {
      query = query.order('report_created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) throw error

    // Normalize to keep previous shape expectations
    let processedData = data.map(report => ({
      ...report,
      id: report.health_report_id,
      created_at: report.report_created_at,
      userData: {
        id: report.user_id,
        full_name: report.user_full_name,
        email: report.user_email,
        ic_number: report.ic_number,
        phone: report.phone
      }
    }))

    // Client-side search across nested user fields (since server-side OR excludes nested relations)
    if (rawSearchKey) {
      const searchLower = rawSearchKey.toLowerCase()
      processedData = processedData.filter(report => {
        const haystack = [
          report.report_type,
          report.report_title,
          report.notes,
          report.userData?.full_name,
          report.userData?.email,
          report.userData?.ic_number,
          report.userData?.phone
        ]

        return haystack.some(val =>
          val && val.toString().toLowerCase().includes(searchLower)
        )
      })
    }

    // Apply due status filtering (complex logic)
    if (filters.dueStatus) {
      processedData = processedData.filter(report => {
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

// ============================================================================
// REMINDERS MODEL AND FUNCTIONALITY
// ============================================================================

/**
 * Reminder Model - Data structure for reminders
 * Maps to the reminders table in Supabase
 */
export class Reminder {
  constructor({
    id = null,
    user_id,
    reminder_type,
    reminder_title,
    reminder_date,
    is_enabled = true,
    reminder_frequencies = null,
    category = 'Health & appointments',
    notes = null,
    created_at = null,
    updated_at = null,
    notified_at = null
  }) {
    this.id = id
    this.user_id = user_id
    this.reminder_type = reminder_type
    this.reminder_title = reminder_title
    this.reminder_date = reminder_date
    this.is_enabled = is_enabled
    this.reminder_frequencies = reminder_frequencies
    this.category = category
    this.notes = notes
    this.created_at = created_at
    this.updated_at = updated_at
    this.notified_at = notified_at
  }

  // Static method to create from database row
  static fromDatabase(row) {
    return new Reminder({
      id: row.id,
      user_id: row.user_id,
      reminder_type: row.reminder_type,
      reminder_title: row.reminder_title,
      reminder_date: new Date(row.reminder_date),
      is_enabled: row.is_enabled,
      reminder_frequencies: row.reminder_frequencies,
      category: row.category,
      notes: row.notes,
      created_at: row.created_at ? new Date(row.created_at) : null,
      updated_at: row.updated_at ? new Date(row.updated_at) : null,
      notified_at: row.notified_at ? new Date(row.notified_at) : null
    })
  }

  // Convert to database format for insert/update
  toDatabaseFormat() {
    return {
      user_id: this.user_id,
      reminder_type: this.reminder_type,
      reminder_title: this.reminder_title,
      reminder_date: this.reminder_date.toISOString(),
      is_enabled: this.is_enabled,
      reminder_frequencies: this.reminder_frequencies,
      category: this.category,
      notes: this.notes
    }
  }

  // Check if reminder is due soon (within 7 days)
  isDueSoon() {
    const now = new Date()
    const reminderDate = new Date(this.reminder_date)
    const diffTime = reminderDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays >= 0
  }

  // Check if reminder is overdue
  isOverdue() {
    const now = new Date()
    const reminderDate = new Date(this.reminder_date)
    return reminderDate < now && this.is_enabled
  }

  // Get reminder display text based on type
  getDisplayType() {
    const typeMap = {
      'Next health check': 'Health Check',
      'Medication refill': 'Medication',
      'Blood pressure check': 'Blood Pressure',
      'Doctor visit': 'Doctor Visit',
      'Vaccination': 'Vaccination',
      'Lab test': 'Lab Test',
      'Custom': 'Custom'
    }
    return typeMap[this.reminder_type] || this.reminder_type
  }

  // Get category display text
  getCategoryDisplay() {
    const categoryMap = {
      'Health & appointments': 'Health & Appointments',
      'Medication': 'Medication',
      'Personal': 'Personal',
      'Other': 'Other'
    }
    return categoryMap[this.category] || this.category
  }

  // Validate reminder data
  static validate(reminderData) {
    const errors = {}

    // Required fields
    if (!reminderData.reminder_title?.trim()) {
      errors.reminder_title = 'Reminder title is required'
    }

    if (!reminderData.reminder_type) {
      errors.reminder_type = 'Reminder type is required'
    }

    if (!reminderData.reminder_date) {
      errors.reminder_date = 'Reminder date is required'
    } else {
      const reminderDate = new Date(reminderData.reminder_date)
      const now = new Date()
      if (reminderDate < now) {
        errors.reminder_date = 'Reminder date must be in the future'
      }
    }

    // Validate reminder type
    const validTypes = [
      'Next health check',
      'Medication refill',
      'Blood pressure check',
      'Doctor visit',
      'Vaccination',
      'Lab test',
      'Custom'
    ]
    if (reminderData.reminder_type && !validTypes.includes(reminderData.reminder_type)) {
      errors.reminder_type = 'Invalid reminder type'
    }

    // Validate category
    const validCategories = [
      'Health & appointments',
      'Medication',
      'Personal',
      'Other'
    ]
    if (reminderData.category && !validCategories.includes(reminderData.category)) {
      errors.category = 'Invalid category'
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }
}

// Constants for dropdown options
export const REMINDER_TYPES = [
  'Next health check',
  'Medication refill',
  'Blood pressure check',
  'Doctor visit',
  'Vaccination',
  'Lab test',
  'Custom'
]

export const REMINDER_CATEGORIES = [
  'Health & appointments',
  'Medication',
  'Personal',
  'Other'
]

// Reminders service functionality integrated into HealthReport
const RemindersService = {
  // Create a new reminder
  async createReminder(reminderData) {
    try {
      // Validate reminder data
      const validation = Reminder.validate(reminderData)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`)
      }

      // Create reminder instance and convert to database format
      const reminder = new Reminder(reminderData)
      const dbData = reminder.toDatabaseFormat()

      const { data, error } = await supabase
        .from('reminders')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      return { success: true, data: Reminder.fromDatabase(data) }
    } catch (error) {
      console.error('Error creating reminder:', error)
      return { success: false, error: error.message }
    }
  },

  // Get all reminders for a user
  async getUserReminders(userId, options = {}) {
    try {
      let query = supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category)
      }

      if (options.reminder_type) {
        query = query.eq('reminder_type', options.reminder_type)
      }

      if (options.is_enabled !== undefined) {
        query = query.eq('is_enabled', options.is_enabled)
      }

      // Apply date filters
      if (options.date_from) {
        query = query.gte('reminder_date', options.date_from)
      }

      if (options.date_to) {
        query = query.lte('reminder_date', options.date_to)
      }

      // Apply ordering
      const orderBy = options.orderBy || 'reminder_date'
      const order = options.order || 'asc'
      query = query.order(orderBy, { ascending: order === 'asc' })

      const { data, error } = await query

      if (error) throw error
      return { success: true, data: data.map(row => Reminder.fromDatabase(row)) }
    } catch (error) {
      console.error('Error fetching reminders:', error)
      return { success: false, error: error.message }
    }
  },

  // Get reminder by ID
  async getReminderById(reminderId) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('id', reminderId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Reminder not found' }
        }
        throw error
      }

      return { success: true, data: Reminder.fromDatabase(data) }
    } catch (error) {
      console.error('Error fetching reminder:', error)
      return { success: false, error: error.message }
    }
  },

  // Update a reminder
  async updateReminder(reminderId, updateData) {
    try {
      // Remove user_id from update data if present (shouldn't be updated)
      const { user_id, id, created_at, ...cleanUpdateData } = updateData
      const result = await corsProxyUpdate('reminders', reminderId, {
        ...cleanUpdateData,
        updated_at: new Date().toISOString()
      })

      if (!result.success) return { success: false, error: result.error }
      return { success: true, data: result.data ? Reminder.fromDatabase(result.data) : null }
    } catch (error) {
      console.error('Error updating reminder:', error)
      return { success: false, error: error.message }
    }
  },

  // Delete a reminder
  async deleteReminder(reminderId) {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      return { success: false, error: error.message }
    }
  },

  // Toggle reminder enabled status
  async toggleReminder(reminderId, isEnabled) {
    try {
      const result = await corsProxyUpdate('reminders', reminderId, {
        is_enabled: isEnabled,
        updated_at: new Date().toISOString()
      })

      if (!result.success) return { success: false, error: result.error }
      return { success: true, data: result.data ? Reminder.fromDatabase(result.data) : null }
    } catch (error) {
      console.error('Error toggling reminder:', error)
      return { success: false, error: error.message }
    }
  },

  // Get upcoming reminders (next 7 days)
  async getUpcomingReminders(userId) {
    try {
      const now = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(now.getDate() + 7)

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .gte('reminder_date', now.toISOString())
        .lte('reminder_date', nextWeek.toISOString())
        .order('reminder_date', { ascending: true })

      if (error) throw error
      return { success: true, data: data.map(row => Reminder.fromDatabase(row)) }
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error)
      return { success: false, error: error.message }
    }
  },

  // Get overdue reminders
  async getOverdueReminders(userId) {
    try {
      const now = new Date()

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .lt('reminder_date', now.toISOString())
        .order('reminder_date', { ascending: false })

      if (error) throw error
      return { success: true, data: data.map(row => Reminder.fromDatabase(row)) }
    } catch (error) {
      console.error('Error fetching overdue reminders:', error)
      return { success: false, error: error.message }
    }
  },

  // Get reminder statistics for dashboard
  async getReminderStatistics(userId) {
    try {
      const now = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(now.getDate() + 7)

      // Get all reminders count
      const { count: totalCount, error: totalError } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_enabled', true)

      // Get upcoming reminders count
      const { count: upcomingCount, error: upcomingError } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .gte('reminder_date', now.toISOString())
        .lte('reminder_date', nextWeek.toISOString())

      // Get overdue reminders count
      const { count: overdueCount, error: overdueError } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .lt('reminder_date', now.toISOString())

      if (totalError || upcomingError || overdueError) {
        throw new Error('Failed to fetch reminder statistics')
      }

      return {
        success: true, 
        data: {
          total: totalCount || 0,
          upcoming: upcomingCount || 0,
          overdue: overdueCount || 0
        }
      }
    } catch (error) {
      console.error('Error fetching reminder statistics:', error)
      return { success: false, error: error.message }
    }
  },

  // Mark reminder as notified
  async markAsNotified(reminderId) {
    try {
      const result = await corsProxyUpdate('reminders', reminderId, {
        notified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      if (!result.success) return { success: false, error: result.error }
      return { success: true, data: result.data ? Reminder.fromDatabase(result.data) : null }
    } catch (error) {
      console.error('Error marking reminder as notified:', error)
      return { success: false, error: error.message }
    }
  }
}

// Export reminders functionality  
export { RemindersService }

/**
 * Get health reports by application ID
 * @param {string} applicationId - Application ID
 * @returns {Promise<Object>} Health reports
 */
export const getHealthReportsByApplication = async (applicationId) => {
  try {
    return await HealthReport.getByApplication(applicationId)
  } catch (error) {
    console.error('Error in getHealthReportsByApplication:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update health report status
 * @param {string} reportId - Health report ID
 * @param {string} status - New status ('Pending', 'Reviewed', 'Flagged')
 * @returns {Promise<Object>} Updated health report
 */
export const updateHealthReportStatus = async (reportId, status) => {
  try {
    return await HealthReport.updateStatus(reportId, status)
  } catch (error) {
    console.error('Error in updateHealthReportStatus:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update health report due status
 * @param {string} reportId - Health report ID
 * @param {string} dueStatus - New due status ('Overdue', 'Due Soon', 'Up to Date')
 * @returns {Promise<Object>} Updated health report
 */
export const updateHealthReportDueStatus = async (reportId, dueStatus) => {
  try {
    return await HealthReport.updateDueStatus(reportId, dueStatus)
  } catch (error) {
    console.error('Error in updateHealthReportDueStatus:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Replace an existing health report file and reset its status
 * @param {string} reportId - Health report ID
 * @param {string} fileUrl - Newly uploaded file URL
 * @param {Object} options - Optional overrides
 * @param {string} [options.status='Pending'] - Status to set after reupload
 * @returns {Promise<Object>} Updated health report
 */
export const reuploadHealthReport = async (reportId, fileUrl, options = {}) => {
  try {
    if (!reportId) {
      return { success: false, error: 'Report ID is required for reupload' }
    }

    if (!fileUrl) {
      return { success: false, error: 'File URL is required for reupload' }
    }

    const status = options.status || 'Pending'
    const timestamp = new Date().toISOString()

    const result = await corsProxyUpdate('health_reports', reportId, {
      report_file_url: fileUrl,
      health_report_status: status,
      updated_at: timestamp
    })

    if (!result.success) throw new Error(result.error)
    return { success: true, data: result.data, message: 'Health report file replaced successfully' }
  } catch (error) {
    console.error('Error reuploading health report:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get admin dashboard statistics
 * @returns {Promise<Object>} Statistics object with counts
 */
export const getAdminStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('health_reports')
      .select('health_report_status, created_at')
      .neq('health_report_status', 'Archived')

    if (error) throw error

    const stats = {
      pending: 0,
      reviewed: 0,
      flagged: 0,
      generated: 0
    }

    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    data.forEach(report => {
      const status = (report.health_report_status || 'Pending').toLowerCase()
      const reportDate = new Date(report.created_at)
      
      // Count by status (using actual schema values)
      if (status === 'pending') stats.pending++
      else if (status === 'reviewed') stats.reviewed++
      else if (status === 'flagged') stats.flagged++
      
      // Count reports generated this month
      if (reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear) {
        stats.generated++
      }
    })

    return { success: true, data: stats }
  } catch (error) {
    console.error('Error fetching admin statistics:', error)
    return { success: false, error: error.message }
  }
}
