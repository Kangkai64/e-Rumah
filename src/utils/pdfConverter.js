// PDF Conversion Utility - Converts images to PDF
import jsPDF from 'jspdf'
import { validatePDF, processPDF } from './pdfCompression'

/**
 * Convert multiple images to a single PDF with compression
 * @param {File[]} imageFiles - Array of image files
 * @param {string} fileName - Name for the generated PDF
 * @param {Object} options - Conversion options
 * @returns {Promise<File>} - Generated PDF file
 */
export const convertImagesToPDF = async (imageFiles, fileName = 'health_report.pdf', options = {}) => {
  try {
    const {
      pdfQuality = 0.8
    } = options

    // Create new jsPDF instance with compression
    const pdf = new jsPDF({
      compress: true,
      precision: 2
    })
    let isFirstPage = true

    console.log(`🔄 Converting ${imageFiles.length} image(s) to PDF...`)

    // Process each image file
    for (let i = 0; i < imageFiles.length; i++) {
      const imageFile = imageFiles[i]
      console.log(`📸 Processing image ${i + 1}/${imageFiles.length}: ${imageFile.name} (${formatBytes(imageFile.size)})`)
      
      // Convert file to base64 data URL
      const dataUrl = await fileToDataURL(imageFile)
      
      // Get image dimensions
      const imgData = await getImageDimensions(dataUrl)
      
      // Add new page for subsequent images
      if (!isFirstPage) {
        pdf.addPage()
      }
      
      // Calculate image dimensions to fit on page
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - (2 * margin)
      const maxHeight = pageHeight - (2 * margin)
      
      let imgWidth = imgData.width
      let imgHeight = imgData.height
      
      // Scale image to fit page while maintaining aspect ratio
      const widthRatio = maxWidth / imgWidth
      const heightRatio = maxHeight / imgHeight
      const ratio = Math.min(widthRatio, heightRatio, 1) // Don't upscale
      
      imgWidth *= ratio
      imgHeight *= ratio
      
      // Center image on page
      const x = (pageWidth - imgWidth) / 2
      const y = (pageHeight - imgHeight) / 2
      
      // Add image to PDF with compression
      pdf.addImage(dataUrl, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'MEDIUM')
      
      isFirstPage = false
    }

    // Generate PDF blob with additional compression
    const pdfBlob = pdf.output('blob')
    
    console.log(`📄 Initial PDF generated: ${formatBytes(pdfBlob.size)}`)
    
    // Create temporary File object from blob
    const tempPdfFile = new File([pdfBlob], fileName, {
      type: 'application/pdf',
      lastModified: Date.now()
    })

    // Apply PDF compression using processPDF
    console.log(`🗜️ Applying PDF compression...`)
    const processResult = await processPDF(tempPdfFile, {
      compress: true,
      compressionLevel: pdfQuality,
      maxFileSize: 5 * 1024 * 1024 // 5MB
    })

    // Use processed PDF if successful, otherwise use original
    const finalPdfFile = processResult.success ? processResult.file : tempPdfFile
    
    console.log(`📄 Final PDF size: ${formatBytes(finalPdfFile.size)}`)

    // Calculate compression ratio
    const totalOriginalSize = imageFiles.reduce((sum, file) => sum + file.size, 0)
    const compressionRatio = ((totalOriginalSize - finalPdfFile.size) / totalOriginalSize * 100).toFixed(1)
    
    console.log(`✅ Conversion completed:`)
    console.log(`   Original images: ${formatBytes(totalOriginalSize)}`)
    console.log(`   Final PDF: ${formatBytes(finalPdfFile.size)}`)
    console.log(`   Compression: ${compressionRatio}%`)

    return finalPdfFile
  } catch (error) {
    console.error('Error converting images to PDF:', error)
    throw new Error('Failed to convert images to PDF: ' + error.message)
  }
}

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

/**
 * Convert file to data URL
 * @param {File} file - Image file
 * @returns {Promise<string>} - Data URL
 */
const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Get image dimensions from data URL
 * @param {string} dataUrl - Image data URL
 * @returns {Promise<{width: number, height: number}>} - Image dimensions
 */
const getImageDimensions = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

/**
 * Check if file is an image
 * @param {File} file - File to check
 * @returns {boolean} - True if file is an image
 */
export const isImageFile = (file) => {
  return file.type.startsWith('image/')
}

/**
 * Check if file is a PDF
 * @param {File} file - File to check
 * @returns {boolean} - True if file is a PDF
 */
export const isPDFFile = (file) => {
  return file.type === 'application/pdf'
}

/**
 * Validate file for health report upload
 * @param {File} file - File to validate
 * @returns {Promise<{valid: boolean, error: string}>} - Validation result
 */
export const validateHealthReportFile = async (file) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  try {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      }
    }
    
    // For images, validate and note they will be converted to PDF
    if (isImageFile(file)) {
      return { 
        valid: true, 
        error: null,
        willConvert: true,
        message: 'Image will be converted to PDF'
      }
    }
    
    // For PDFs, check integrity
    if (isPDFFile(file)) {
      const isPDFValid = await validatePDF(file)
      if (!isPDFValid) {
        return {
          valid: false,
          error: 'PDF file appears to be corrupted. Please try uploading a different file or contact support.'
        }
      }
      
      return { 
        valid: true, 
        error: null,
        willCompress: file.size > (2 * 1024 * 1024), // Will compress if > 2MB
        message: file.size > (2 * 1024 * 1024) ? 'PDF will be compressed to reduce file size' : null
      }
    }
    
    // Invalid file type
    return {
      valid: false,
      error: 'Only PDF and image files (JPG, PNG) are allowed'
    }
    
  } catch (error) {
    console.error('File validation error:', error)
    return {
      valid: false,
      error: 'File validation failed. Please try again or contact support.'
    }
  }
}