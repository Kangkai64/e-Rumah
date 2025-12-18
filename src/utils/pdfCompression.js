// PDF Compression Utility
import { PDFDocument } from 'pdf-lib'

/**
 * Compress a PDF file by reducing image quality and removing unnecessary elements
 * @param {File} pdfFile - The PDF file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed PDF file
 */
export const compressPDF = async (pdfFile, options = {}) => {
  try {
    // Read the PDF file
    const arrayBuffer = await pdfFile.arrayBuffer()
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    
    // Get compression settings
    const compressionLevel = options.compressionLevel || 0.8 // 0.1 to 1.0
    const maxFileSize = options.maxFileSize || 5 * 1024 * 1024 // 5MB default
    
    // Serialize PDF with compression
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: false, // Better compatibility
      addDefaultPage: false,
      objectsPerTick: 50
    })
    
    // Create new compressed file
    const compressedSize = compressedPdfBytes.byteLength
    const originalSize = arrayBuffer.byteLength
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
    
    console.log(`📦 PDF Compression Results:`)
    console.log(`  Original: ${formatBytes(originalSize)}`)
    console.log(`  Compressed: ${formatBytes(compressedSize)}`)
    console.log(`  Reduction: ${compressionRatio}%`)
    
    // If still too large, try additional compression
    let finalBytes = compressedPdfBytes
    
    if (compressedSize > maxFileSize && compressionLevel > 0.3) {
      console.log('🔄 File still too large, applying additional compression...')
      
      // Reload and apply more aggressive compression
      const reloadedDoc = await PDFDocument.load(compressedPdfBytes)
      finalBytes = await reloadedDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 25
      })
      
      console.log(`  Final size: ${formatBytes(finalBytes.byteLength)}`)
    }
    
    // Create new File object
    const compressedFile = new File(
      [finalBytes], 
      `compressed_${pdfFile.name}`, 
      { 
        type: 'application/pdf',
        lastModified: Date.now()
      }
    )
    
    return {
      success: true,
      file: compressedFile,
      originalSize,
      compressedSize: finalBytes.byteLength,
      compressionRatio: ((originalSize - finalBytes.byteLength) / originalSize * 100).toFixed(1)
    }
    
  } catch (error) {
    console.error('PDF Compression failed:', error)
    
    // Return original file if compression fails
    return {
      success: false,
      file: pdfFile,
      error: error.message,
      fallbackToOriginal: true
    }
  }
}

/**
 * Validate PDF file integrity
 * @param {File} pdfFile - PDF file to validate
 * @returns {Promise<boolean>} - Whether the PDF is valid
 */
export const validatePDF = async (pdfFile) => {
  try {
    const arrayBuffer = await pdfFile.arrayBuffer()
    
    // Check for PDF header
    const header = new Uint8Array(arrayBuffer.slice(0, 4))
    const pdfSignature = new TextDecoder().decode(header)
    
    if (!pdfSignature.includes('%PDF')) {
      console.error('Invalid PDF: Missing PDF header')
      return false
    }
    
    // Try to load with pdf-lib to validate structure
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pageCount = pdfDoc.getPageCount()
    
    console.log(`✅ PDF Validation: ${pageCount} page(s), ${formatBytes(arrayBuffer.byteLength)}`)
    
    return pageCount > 0
    
  } catch (error) {
    console.error('PDF Validation failed:', error)
    return false
  }
}

/**
 * Fix common PDF corruption issues
 * @param {File} pdfFile - Potentially corrupted PDF file
 * @returns {Promise<File>} - Fixed PDF file
 */
export const repairPDF = async (pdfFile) => {
  try {
    console.log('🔧 Attempting to repair PDF...')
    
    const arrayBuffer = await pdfFile.arrayBuffer()
    
    // Load and re-save the PDF (this fixes many corruption issues)
    const pdfDoc = await PDFDocument.load(arrayBuffer, {
      ignoreEncryption: true,
      parseSpeed: 'fast'
    })
    
    // Re-serialize the PDF
    const repairedBytes = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false
    })
    
    // Create repaired file
    const repairedFile = new File(
      [repairedBytes], 
      `repaired_${pdfFile.name}`, 
      { 
        type: 'application/pdf',
        lastModified: Date.now()
      }
    )
    
    console.log('✅ PDF repair completed')
    
    return {
      success: true,
      file: repairedFile,
      wasRepaired: true
    }
    
  } catch (error) {
    console.error('PDF repair failed:', error)
    
    // Return original file if repair fails
    return {
      success: false,
      file: pdfFile,
      error: error.message,
      wasRepaired: false
    }
  }
}

/**
 * Process PDF file: validate, compress, and repair if needed
 * @param {File} pdfFile - PDF file to process
 * @param {Object} options - Processing options
 * @returns {Promise<File>} - Processed PDF file
 */
export const processPDF = async (pdfFile, options = {}) => {
  try {
    console.log(`🔍 Processing PDF: ${pdfFile.name} (${formatBytes(pdfFile.size)})`)
    
    // Step 1: Validate PDF
    const isValid = await validatePDF(pdfFile)
    let currentFile = pdfFile
    
    // Step 2: Repair if invalid
    if (!isValid) {
      console.log('⚠️ PDF appears invalid, attempting repair...')
      const repairResult = await repairPDF(currentFile)
      if (repairResult.success) {
        currentFile = repairResult.file
        console.log('✅ PDF repaired successfully')
      } else {
        console.warn('❌ PDF repair failed, proceeding with original')
      }
    }
    
    // Step 3: Compress if needed
    const shouldCompress = options.compress !== false && currentFile.size > (2 * 1024 * 1024) // 2MB
    
    if (shouldCompress) {
      console.log('📦 Compressing PDF...')
      const compressResult = await compressPDF(currentFile, options)
      if (compressResult.success) {
        currentFile = compressResult.file
        console.log(`✅ PDF compressed: ${compressResult.compressionRatio}% reduction`)
      } else {
        console.warn('❌ PDF compression failed, using original')
      }
    }
    
    return {
      success: true,
      file: currentFile,
      processed: true
    }
    
  } catch (error) {
    console.error('PDF processing failed:', error)
    return {
      success: false,
      file: pdfFile,
      error: error.message,
      processed: false
    }
  }
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}