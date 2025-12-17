// File Upload Service - Handles document uploads to Supabase Storage

import { supabase } from '../config/supabase'

/**
 * Upload file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} userId - Current user ID
 * @param {string} documentType - Type of document (e.g., 'applicantNRIC')
 * @param {Object} options - Optional settings (bucket, signedUrlDuration)
 * @returns {Promise<{url, fileName, uploadedAt, error}>}
 */
export const uploadDocument = async (file, userId, documentType, options = {}) => {
  try {
    const bucket = options.bucket || 'application-documents'
    const signedUrlDuration = options.signedUrlDuration ?? 31536000

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
      .from(bucket)
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
      .from(bucket)
      .createSignedUrl(filePath, signedUrlDuration) // default 1 year in seconds

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
 * @param {Object} options - Optional settings (bucket)
 */
export const deleteDocument = async (fileUrl, userId, options = {}) => {
  try {
    const bucket = options.bucket || 'application-documents'

    if (!fileUrl) {
      return { success: false, error: { message: 'No file URL provided' } }
    }

    // Extract file path from URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/application-documents/{userId}/{fileName}
    const urlParts = fileUrl.split('/')
    const fileName = urlParts[urlParts.length - 1].split('?')[0]
    const filePath = `${userId}/${fileName}`

    console.log('🗑️ Deleting file:', filePath)

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('❌ Delete error:', error)
      return { success: false, error }
    }

    console.log('✅ File deleted successfully')
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
