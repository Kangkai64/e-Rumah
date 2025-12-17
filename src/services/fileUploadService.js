// File Upload Service - Handles document uploads to Supabase Storage

import { supabase } from '../config/supabase'

/**
 * Upload file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} userId - Current user ID
 * @param {string} documentType - Type of document (e.g., 'applicantNRIC')
 * @returns {Promise<{url, fileName, uploadedAt, error}>}
 */
export const uploadDocument = async (file, userId, documentType) => {
  try {
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
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ]
    if (!allowedTypes.includes(file.type)) {
      return {
        url: null,
        fileName: null,
        uploadedAt: null,
        error: { message: 'Only PDF, JPG, and PNG files are allowed' }
      }
    }

    // Generate unique file path
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `${sanitizedDocType}_${timestamp}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    console.log('📤 Uploading file:', { fileName, size: file.size, type: file.type })

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('application-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('❌ Upload error:', error)
      return { url: null, fileName: null, uploadedAt: null, error }
    }

    // Create signed URL (valid for 1 year) for private bucket with RLS
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('application-documents')
      .createSignedUrl(filePath, 31536000) // 1 year in seconds

    if (signedError) {
      console.error('❌ Signed URL error:', signedError)
      return { url: null, fileName: null, uploadedAt: null, error: signedError }
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
 * Delete document from Supabase Storage
 * @param {string} fileUrl - URL of file to delete
 * @param {string} userId - Current user ID
 */
export const deleteDocument = async (fileUrl, userId) => {
  try {
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
      .from('application-documents')
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
  } catch (error) {
    console.error('❌ Download error:', error)
    alert('Failed to download file. Please try again.')
  }
}
