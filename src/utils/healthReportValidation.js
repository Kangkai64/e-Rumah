/**
 * Health Report Validation Utilities
 * Validates health report data before database operations
 */

// ============================================================================
// FILE VALIDATION
// ============================================================================

/**
 * Validate file for health report upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result { valid: boolean, error: string | null }
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file selected' }
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
  const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png']

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` 
    }
  }

  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: 'Invalid file type. Only PDF and image files are allowed' 
    }
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return { 
      valid: false, 
      error: 'Invalid file extension. Only .pdf, .jpg, .jpeg, .png are allowed' 
    }
  }

  return { valid: true, error: null }
}

// ============================================================================
// HEALTH REPORT DATA VALIDATION
// ============================================================================

/**
 * Validate health report upload form data
 * @param {Object} data - Form data to validate
 * @returns {Object} Validation result { valid: boolean, errors: {} }
 */
export const validateHealthReportUpload = (data) => {
  const errors = {}

  // Validate report type
  if (!data.reportType || data.reportType.trim() === '') {
    errors.reportType = 'Report type is required'
  }

  // Validate report date
  if (!data.reportDate || data.reportDate.trim() === '') {
    errors.reportDate = 'Report date is required'
  } else {
    const reportDate = new Date(data.reportDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (reportDate > today) {
      errors.reportDate = 'Report date cannot be in the future'
    }
  }

  // Validate file
  if (!data.file) {
    errors.file = 'File is required'
  }

  // Validate notes (optional but check length if provided)
  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes must not exceed 500 characters'
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ============================================================================
// SHARE FORM VALIDATION
// ============================================================================

/**
 * Validate health report share form data
 * @param {Object} data - Share form data to validate
 * @returns {Object} Validation result { valid: boolean, errors: {} }
 */
export const validateShareForm = (data) => {
  const errors = {}

  // Validate share option
  if (!data.shareOption || data.shareOption.trim() === '') {
    errors.shareOption = 'Please select a sharing option'
  }

  // Validate email for email-based sharing
  if (['caregiver', 'family', 'healthcare'].includes(data.shareOption)) {
    if (!data.shareEmail || data.shareEmail.trim() === '') {
      errors.shareEmail = 'Email address is required'
    } else if (!isValidEmail(data.shareEmail)) {
      errors.shareEmail = 'Please enter a valid email address'
    }
  }

  // Validate expiry date if provided
  if (data.expiryDate && data.expiryDate.trim() !== '') {
    const expiryDate = new Date(data.expiryDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (expiryDate <= today) {
      errors.expiryDate = 'Expiry date must be in the future'
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// ============================================================================
// DATE VALIDATION AND FORMATTING
// ============================================================================

/**
 * Validate date range
 * @param {string} startDate - Start date (ISO format)
 * @param {string} endDate - End date (ISO format)
 * @returns {Object} Validation result { valid: boolean, error: string | null }
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return { valid: true, error: null }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) {
    return { 
      valid: false, 
      error: 'Start date must be before end date' 
    }
  }

  return { valid: true, error: null }
}

/**
 * Format date to DD/MM/YYYY format
 * @param {string} dateString - Date string in ISO format
 * @returns {string} Formatted date
 */
export const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}/${month}/${year}`
}

/**
 * Format date to DD MMM YYYY format
 * @param {string} dateString - Date string in ISO format
 * @returns {string} Formatted date
 */
export const formatDateToReadable = (dateString) => {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
}

// ============================================================================
// EMAIL VALIDATION
// ============================================================================

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// ============================================================================
// REPORT TYPE UTILITIES
// ============================================================================

/**
 * Get list of valid report types
 * @returns {Array} Array of report types
 */
export const getReportTypes = () => {
  return [
    'Medical Report',
    'Lab Test',
    'Prescription',
    'Vaccination Record',
    "Doctor's Visit Summary"
  ]
}

/**
 * Check if report type is valid
 * @param {string} reportType - Report type to check
 * @returns {boolean} True if valid
 */
export const isValidReportType = (reportType) => {
  return getReportTypes().includes(reportType)
}

// ============================================================================
// SHARING OPTIONS UTILITIES
// ============================================================================

/**
 * Get list of valid sharing options
 * @returns {Array} Array of sharing options
 */
export const getSharingOptions = () => {
  return [
    { value: 'caregiver', label: 'Share with Caregiver', icon: '👨‍⚕️' },
    { value: 'family', label: 'Share with Family Member', icon: '👨‍👩‍👧' },
    { value: 'healthcare', label: 'Share with Healthcare Provider', icon: '🏥' },
    { value: 'link', label: 'Generate Share Link', icon: '🔗' },
    { value: 'download', label: 'Download as PDF', icon: '⬇️' }
  ]
}

/**
 * Check if sharing option is valid
 * @param {string} shareOption - Share option to check
 * @returns {boolean} True if valid
 */
export const isValidShareOption = (shareOption) => {
  const validOptions = getSharingOptions().map(opt => opt.value)
  return validOptions.includes(shareOption)
}
