// File Upload Service - Handles document uploads to Supabase Storage

import { supabase } from '../config/supabase'
import { validatePDF } from '../utils/pdfCompression'

/**
 * Verify an image file actually decodes to a real image (catches empty
 * files and corrupted/truncated image data that still carry a valid
 * image/* MIME type).
 * @param {File} file
 * @returns {Promise<boolean>}
 */
const validateImageFile = (file) => {
  return new Promise((resolve) => {
    if (typeof createImageBitmap === 'function') {
      createImageBitmap(file)
        .then((bitmap) => {
          const isValid = bitmap.width > 0 && bitmap.height > 0
          bitmap.close?.()
          resolve(isValid)
        })
        .catch(() => resolve(false))
      return
    }

    // Fallback for browsers without createImageBitmap
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(img.naturalWidth > 0 && img.naturalHeight > 0)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(false)
    }
    img.src = objectUrl
  })
}

/**
 * Upload file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} userId - Current user ID
 * @param {string} documentType - Type of document (e.g., 'applicantNRIC')
 * @param {Object} options - Optional settings (bucket, signedUrlDuration, allowedTypes)
 * @returns {Promise<{url, fileName, uploadedAt, error}>}
 */
export const uploadDocument = async (file, userId, documentType, options = {}) => {
  try {
    const bucket = options.bucket || 'application-documents'
    const signedUrlDuration = options.signedUrlDuration ?? 31536000
    const allowedTypes = options.allowedTypes || [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ]

    // Reject empty files (e.g. a 0-byte .pdf or .png) up front
    if (file.size === 0) {
      return {
        url: null,
        fileName: null,
        uploadedAt: null,
        error: { message: 'This file is empty. Please upload a valid file.' }
      }
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { 
        url: null,
        fileName: null,
        uploadedAt: null,
        error: { message: 'File size must be less than 10MB' }
      }
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      const allowedExtensions = [...new Set(allowedTypes.map(type => {
        switch(type) {
          case 'application/pdf': return 'PDF'
          case 'image/jpeg':
          case 'image/jpg': return 'JPG'
          case 'image/png': return 'PNG'
          case 'image/webp': return 'WEBP'
          default: return type
        }
      }))].join(', ')
      
      return {
        url: null,
        fileName: null,
        uploadedAt: null,
        error: { message: `Only ${allowedExtensions} files are allowed` }
      }
    }

    // Reject corrupted/fake PDFs: browser-reported MIME type can be spoofed
    // or wrong (e.g. a renamed .txt), so verify the actual PDF structure.
    if (file.type === 'application/pdf') {
      const isPDFValid = await validatePDF(file)
      if (!isPDFValid) {
        return {
          url: null,
          fileName: null,
          uploadedAt: null,
          error: { message: 'This PDF file appears to be corrupted or invalid. Please upload a valid PDF file.' }
        }
      }
    }

    // Reject corrupted/truncated images that still report a valid image/* MIME type
    if (file.type.startsWith('image/')) {
      const isImageValid = await validateImageFile(file)
      if (!isImageValid) {
        return {
          url: null,
          fileName: null,
          uploadedAt: null,
          error: { message: 'This image file appears to be corrupted or invalid. Please upload a valid image file.' }
        }
      }
    }

    // Generate unique file path. Callers may supply a meaningful, pre-derived
    // name (e.g. a health report reference code) via options.customFileName;
    // otherwise fall back to the generic <docType>_<timestamp> scheme.
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    let fileName
    if (options.customFileName) {
      const sanitizedCustomName = options.customFileName.replace(/[^a-zA-Z0-9-]/g, '_')
      fileName = `${sanitizedCustomName}.${fileExt}`
    } else {
      const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9]/g, '_')
      fileName = `${sanitizedDocType}_${timestamp}.${fileExt}`
    }
    const filePath = `${userId}/${fileName}`

    console.log('📤 Uploading file:', { fileName, size: file.size, type: file.type })

    // Ensure binary upload for PDFs to prevent corruption
    const uploadOptions = {
      cacheControl: '3600',
      upsert: false
    }
    
    // For PDFs, ensure proper content type
    if (file.type === 'application/pdf') {
      uploadOptions.contentType = 'application/pdf'
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, uploadOptions)

    if (error) {
      console.error('❌ Upload error:', error)
      return { url: null, fileName: null, uploadedAt: null, error }
    }

    console.log('✅ File uploaded to storage:', { filePath, bucket })

    // Small delay to ensure file is fully committed to storage
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify file exists before creating signed URL
    const { data: listData, error: listError } = await supabase.storage
      .from(bucket)
      .list(userId, {
        search: fileName.substring(0, fileName.lastIndexOf('.')) // Search by name without extension
      })
    
    if (listError) {
      console.warn('⚠️ Could not verify file exists:', listError)
    } else {
      console.log('📋 Files in user directory:', listData?.map(f => f.name))
    }

    // Try to create signed URL first (for private buckets)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, signedUrlDuration)

    if (signedError) {
      console.warn('⚠️ Signed URL failed (likely public bucket):', signedError.message)
      
      // Fallback to public URL for public buckets
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      
      if (publicUrlData?.publicUrl) {
        console.log('✅ Using public URL instead:', publicUrlData.publicUrl)
        return {
          url: publicUrlData.publicUrl,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
          error: null
        }
      } else {
        console.error('❌ Both signed and public URL failed')
        return { url: null, fileName: null, uploadedAt: null, error: signedError }
      }
    }

    console.log('✅ File uploaded successfully:', signedUrlData.signedUrl)

    return {
      url: signedUrlData.signedUrl,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      error: null
    }
  } catch (error) {
    console.error('❌ Upload exception:', error)
    return { url: null, fileName: null, uploadedAt: null, error }
  }
}

const HEALTH_REPORT_TYPE_CODES = {
  'Medical Report': 'MED',
  'Lab Test': 'LAB',
  'Prescription': 'RX',
  'Vaccination Record': 'VAC',
  "Doctor's Visit Summary": 'VIS',
  'Others': 'OTH'
}

/**
 * Derive a short, human-readable reference code for a health report, e.g.
 * "HR-LAB-20260710-3F2A", used as the storage file name instead of an
 * opaque `health-report_<timestamp>` name.
 * @param {string} reportType - The selected report type (or custom type text)
 * @param {string|Date} reportDate - The report's date
 * @returns {string}
 */
export const generateHealthReportCode = (reportType, reportDate) => {
  const typeCode = HEALTH_REPORT_TYPE_CODES[reportType] || 'GEN'

  const date = reportDate ? new Date(reportDate) : new Date()
  const datePart = Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10).replace(/-/g, '')
    : date.toISOString().slice(0, 10).replace(/-/g, '')

  const randomBytes = new Uint8Array(2)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes)
  } else {
    randomBytes[0] = Math.floor(Math.random() * 256)
    randomBytes[1] = Math.floor(Math.random() * 256)
  }
  const suffix = Array.from(randomBytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase()

  return `HR-${typeCode}-${datePart}-${suffix}`
}

/**
 * Upload health report (PDF only) to Supabase Storage
 * @param {File} file - The PDF file to upload
 * @param {string} userId - Current user ID
 * @param {string} documentType - Type of document (e.g., 'health_report')
 * @param {Object} options - Optional settings (bucket, signedUrlDuration, reportType, reportDate)
 * @returns {Promise<{url, fileName, uploadedAt, error}>}
 */
export const uploadHealthReport = async (file, userId, documentType, options = {}) => {
  // Health reports must be PDF only
  const healthReportOptions = {
    ...options,
    allowedTypes: ['application/pdf'],
    bucket: options.bucket || 'health-reports',
    customFileName: options.customFileName || generateHealthReportCode(options.reportType, options.reportDate)
  }

  return uploadDocument(file, userId, documentType, healthReportOptions)
}

/**
 * Delete document from Supabase Storage
 * @param {string} fileUrl - URL of file to delete
 * @param {string} userId - Current user ID
 * @param {Object} options - Optional settings (bucket)
 */
export const deleteDocument = async (fileUrl, userId, options = {}) => {
  try {
    const bucket = options.bucket || 'application-documents'

    if (!fileUrl) {
      return { success: false, error: { message: 'No file URL provided' } }
    }

    // Extract file path from URL
    // Signed URL format: https://xxx.supabase.co/storage/v1/object/sign/application-documents/{userId}/{fileName}?token=...
    // Public URL format: https://xxx.supabase.co/storage/v1/object/public/application-documents/{userId}/{fileName}
    
    let filePath = ''
    
    // Check if it's a signed URL (contains 'object/sign')
    if (fileUrl.includes('/object/sign/')) {
      const pathMatch = fileUrl.match(/\/object\/sign\/application-documents\/(.+?)(?:\?|$)/)
      if (pathMatch) {
        filePath = pathMatch[1]
      }
    } 
    // Check if it's a public URL (contains 'object/public')
    else if (fileUrl.includes('/object/public/')) {
      const pathMatch = fileUrl.match(/\/object\/public\/application-documents\/(.+?)(?:\?|$)/)
      if (pathMatch) {
        filePath = pathMatch[1]
      }
    }
    // Fallback: extract from URL parts
    else {
      const urlParts = fileUrl.split('/')
      const fileName = urlParts[urlParts.length - 1].split('?')[0] // Remove query params
      filePath = `${userId}/${fileName}`
    }

    if (!filePath) {
      console.error('❌ Could not extract file path from URL:', fileUrl)
      return { success: false, error: { message: 'Invalid file URL format' } }
    }

    console.log('🗑️ Deleting file:', filePath)

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('❌ Delete error:', error)
      return { success: false, error }
    }

    console.log('✅ File deleted successfully from storage')
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Delete exception:', error)
    return { success: false, error }
  }
}

/**
 * Download document from URL
 * @param {string} fileUrl - URL of file
 * @param {string} fileName - Original file name
 */
export const downloadDocument = async (fileUrl, fileName) => {
  try {
    console.log('⬇️ Downloading file:', fileName)
    
    const response = await fetch(fileUrl)
    const blob = await response.blob()
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    
    window.URL.revokeObjectURL(url)
    console.log('✅ File downloaded successfully')
    return { success: true, error: null }
  } catch (error) {
    console.error('❌ Download error:', error)
    return { success: false, error: { message: 'Failed to download file. Please try again.' } }
  }
}
