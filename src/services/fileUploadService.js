// File Upload Service - Handles document uploads to Supabase Storage

import { supabase } from '../config/supabase'

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
      'image/png'
    ]

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
      const allowedExtensions = allowedTypes.map(type => {
        switch(type) {
          case 'application/pdf': return 'PDF'
          case 'image/jpeg':
          case 'image/jpg': return 'JPG'
          case 'image/png': return 'PNG'
          default: return type
        }
      }).join(', ')
      
      return {
        url: null,
        fileName: null,
        uploadedAt: null,
        error: { message: `Only ${allowedExtensions} files are allowed` }
      }
    }

    // Generate unique file path
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `${sanitizedDocType}_${timestamp}.${fileExt}`
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
        search: fileName.split('_')[1] // Search by timestamp part
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

/**
 * Upload health report (PDF only) to Supabase Storage
 * @param {File} file - The PDF file to upload
 * @param {string} userId - Current user ID
 * @param {string} documentType - Type of document (e.g., 'health_report')
 * @param {Object} options - Optional settings (bucket, signedUrlDuration)
 * @returns {Promise<{url, fileName, uploadedAt, error}>}
 */
export const uploadHealthReport = async (file, userId, documentType, options = {}) => {
  // Health reports must be PDF only
  const healthReportOptions = {
    ...options,
    allowedTypes: ['application/pdf'],
    bucket: options.bucket || 'health-reports'
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
