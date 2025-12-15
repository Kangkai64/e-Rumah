// Health Report Service
// Handles health report business logic and Supabase operations

import { supabase } from '../config/supabase'
import HealthReport from '../models/HealthReport'

/**
 * Upload a health report file and create database record
 * @param {string} userId - User ID
 * @param {File} file - File to upload
 * @param {Object} metadata - Report metadata
 * @returns {Promise<Object>} Created health report
 */
export const uploadHealthReport = async (userId, file, metadata) => {
  try {
    // Validate file
    const validationResult = validateFile(file)
    if (!validationResult.valid) {
      return { success: false, error: validationResult.error }
    }

    // Upload file to storage
    const uploadResult = await HealthReport.uploadFile(userId, file)
    if (!uploadResult.success) {
      return uploadResult
    }

    // Create database record
    const reportData = {
      userId,
      applicationId: metadata.applicationId,
      reportType: metadata.reportType,
      reportDate: metadata.reportDate,
      reportFileUrl: uploadResult.data.url,
      notes: metadata.notes
    }

    const createResult = await HealthReport.create(reportData)
    return createResult
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
        return { success: true, action: 'download', url: report.file_url }
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

/**
 * Validate uploaded file
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
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

/**
 * Calculate due date based on report type
 * @param {string} reportDate - Report date
 * @param {string} reportType - Type of report
 * @returns {string} Due date
 */
function calculateDueDate(reportDate, reportType) {
  const date = new Date(reportDate)

  // Default: 3 months for most reports
  let monthsToAdd = 3

  // Customize based on report type
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
    case 'Doctor\'s Visit Summary':
      monthsToAdd = 3
      break
    default:
      monthsToAdd = 3
  }

  date.setMonth(date.getMonth() + monthsToAdd)
  return date.toISOString()
}

/**
 * Format date for display
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Share with caregiver
 * @param {Object} report - Health report
 * @param {Object} shareData - Share data
 * @returns {Promise<Object>} Share result
 */
async function shareWithCaregiver(report, shareData) {
  try {
    // Create a share record in the database
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

    // TODO: Send notification to caregiver
    return { success: true, data, message: 'Report shared with caregiver successfully' }
  } catch (error) {
    console.error('Error sharing with caregiver:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Share with family member
 * @param {Object} report - Health report
 * @param {Object} shareData - Share data
 * @returns {Promise<Object>} Share result
 */
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

    // TODO: Send notification to family member
    return { success: true, data, message: 'Report shared with family member successfully' }
  } catch (error) {
    console.error('Error sharing with family:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Share with healthcare provider
 * @param {Object} report - Health report
 * @param {Object} shareData - Share data
 * @returns {Promise<Object>} Share result
 */
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

    // TODO: Send secure email to healthcare provider
    return { success: true, data, message: 'Report shared with healthcare provider successfully' }
  } catch (error) {
    console.error('Error sharing with healthcare provider:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Generate shareable link with expiry
 * @param {Object} report - Health report
 * @param {Object} shareData - Share data
 * @returns {Promise<Object>} Share result
 */
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

/**
 * Share via email
 * @param {Object} report - Health report
 * @param {Object} shareData - Share data
 * @returns {Promise<Object>} Share result
 */
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

    // TODO: Integrate with email service
    // await sendEmail({
    //   to: shareData.email,
    //   subject: 'Health Report Shared',
    //   body: `A health report has been shared with you. View it here: ${report.file_url}`
    // })

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

/**
 * Generate random token for shareable links
 * @returns {string} Random token
 */
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}
