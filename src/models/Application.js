// Application Model
// Handles all database operations for applications
// NO imports from other models allowed!

import { supabase } from '../config/supabase'

// Define the 17 required documents in order
const REQUIRED_DOCUMENTS = [
  { displayName: 'Applicant NRIC', prefix: 'applicantNRIC_' },
  { displayName: 'Bank Statement 1', prefix: 'bankStatements_1_' },
  { displayName: 'Bank Statement 2', prefix: 'bankStatements_2_' },
  { displayName: 'Bank Statement 3', prefix: 'bankStatements_3_' },
  { displayName: 'Bank Statement 4', prefix: 'bankStatements_4_' },
  { displayName: 'Bank Statement 5', prefix: 'bankStatements_5_' },
  { displayName: 'Bank Statement 6', prefix: 'bankStatements_6_' },
  { displayName: 'Birth Certificate', prefix: 'birthCertificate_' },
  { displayName: 'EPF Statement', prefix: 'epfStatement_' },
  { displayName: 'Fire Insurance', prefix: 'fireInsurance_' },
  { displayName: 'Grant Title', prefix: 'grantTitle_' },
  { displayName: 'Marriage Certificate', prefix: 'marriageCertificate_' },
  { displayName: 'Pay Slip 1', prefix: 'payslips_1_' },
  { displayName: 'Pay Slip 2', prefix: 'payslips_2_' },
  { displayName: 'Pay Slip 3', prefix: 'payslips_3_' },
  { displayName: 'Sale Agreement', prefix: 'saleAgreement_' },
  { displayName: 'Valuation Report', prefix: 'valuationReport_' }
]

const Application = {
  /**
   * Create a new application in the database
   * @param {Object} applicationData - The application form data
   * @returns {Promise<Object>} Created application record
   */
  async create(applicationData) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert([{
          user_id: applicationData.userId,
          property_id: applicationData.propertyId,
          nominee_ids: applicationData.nomineeIds || [],
          health_report_id: applicationData.healthReportId,
          submitted_form_data: applicationData.formData,
          status: 'pending',
          submitted_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error creating application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get application by ID
   * @param {string} applicationId - The application ID
   * @returns {Promise<Object>} Application record
   */
  async getById(applicationId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get full application details with form data, nominees, and properties
   * @param {string} applicationId - The application ID
   * @returns {Promise<Object>} Complete application with all related data
   */
  async getFullById(applicationId) {
    try {
      // Fetch application with user data
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          user:users!applications_user_id_fkey(id, full_name, email, ic_number, phone),
          joint_user:users!applications_joint_user_id_fkey(id, full_name, email, ic_number, phone)
        `)
        .eq('id', applicationId)
        .single()

      if (appError) throw appError

      // Fetch application_data (form_data JSONB)
      const { data: appData, error: dataError } = await supabase
        .from('application_data')
        .select('*')
        .eq('application_id', applicationId)
        .maybeSingle()

      if (dataError) throw dataError

      // Fetch nominees
      const { data: nominees, error: nomineesError } = await supabase
        .from('nominees')
        .select('*')
        .eq('application_id', applicationId)

      if (nomineesError) throw nomineesError

      // Fetch properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('*')
        .eq('application_id', applicationId)

      if (propertiesError) throw propertiesError

      // Combine all data
      const fullApplication = {
        ...application,
        application_data: appData,
        form_data: appData?.form_data || {},
        current_step: appData?.current_step || 1,
        nominees: nominees || [],
        properties: properties || []
      }

      return { success: true, data: fullApplication }
    } catch (error) {
      console.error('Error fetching full application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all applications for a specific user
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of applications
   */
  async getByUserId(userId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching user applications:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update application status
   * @param {string} applicationId - The application ID
   * @param {string} status - New status (pending, approved, rejected)
   * @returns {Promise<Object>} Updated application
   */
  async updateStatus(applicationId, status) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error updating application status:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update application with approval details
   * @param {string} applicationId - The application ID
   * @param {Object} approvalData - Approval data (monthly amount, total amount, admin notes)
   * @returns {Promise<Object>} Updated application
   */
  async approve(applicationId, approvalData) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          status: 'approved',
          approved_monthly_amount: approvalData.monthlyAmount,
          approved_total_amount: approvalData.totalAmount,
          approved_at: new Date().toISOString(),
          admin_notes: approvalData.adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error approving application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Clear flagged status and fields (called after nominee update)
   * @param {string} applicationId - The application ID
   * @returns {Promise<Object>} Updated application
   */
  async clearFlaggedStatus(applicationId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          is_flagged: false,
          flagged_code: null,
          flagged_reason: null,
          flagged_at: null,
          flagged_by: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error clearing flagged status:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Terminate application with user-provided reason
   * Sets status to 'underReviewed' for admin approval of termination
   * @param {string} applicationId - The application ID
   * @param {string} terminationReason - Reason for termination
   * @returns {Promise<Object>} Updated application
   */
  async terminate(applicationId, terminationReason) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          status: 'underReviewed',
          termination_reason: terminationReason,
          termination_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error submitting termination request:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Approve termination request (admin only)
   * @param {string} applicationId - The application ID
   * @returns {Promise<Object>} Updated application
   */
  async approveTermination(applicationId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          status: 'terminated',
          termination_update_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error approving termination:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Reject termination request and revert to approved status (admin only)
   * @param {string} applicationId - The application ID
   * @returns {Promise<Object>} Updated application
   */
  async rejectTermination(applicationId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .update({
          status: 'approved',
          termination_reason: null,
          termination_submitted_at: null,
          termination_update_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error rejecting termination:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete application
   * @param {string} applicationId - The application ID
   * @returns {Promise<Object>} Deletion result
   */
  async delete(applicationId) {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all applications (admin function)
   * @param {Object} filters - Optional filters (status, dateRange)
   * @returns {Promise<Array>} Array of all applications
   */
  async getAll(filters = {}) {
    try {
      let query = supabase
        .from('applications')
        .select(`
          *,
          user:users(id, full_name, email)
        `)
        .order('submitted_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.dateFrom) {
        query = query.gte('submitted_at', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('submitted_at', filters.dateTo)
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching all applications:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get flagged applications (for support workspace)
   * @returns {Promise<Array>} Array of flagged applications
   */
  async getFlagged() {
    try {
      // First, try without the join to see if flagged applications exist
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('is_flagged', true)
        .order('flagged_at', { ascending: false })

      if (error) throw error

      // Then enrich with user data
      if (data && data.length > 0) {
        const enrichedData = await Promise.all(
          data.map(async (app) => {
            if (app.user_id) {
              const { data: userData } = await supabase
                .from('users')
                .select('id, full_name, email')
                .eq('id', app.user_id)
                .single()

              return { ...app, user: userData || {} }
            }
            return { ...app, user: {} }
          })
        )
        return { success: true, data: enrichedData }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching flagged applications:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Save draft application to localStorage
   * @param {Object} formData - The form data to save
   */
  saveDraft(formData) {
    try {
      localStorage.setItem('ssbFormData', JSON.stringify(formData))
      return { success: true }
    } catch (error) {
      console.error('Error saving draft:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Load draft application from localStorage
   * @returns {Object|null} Saved form data or null
   */
  loadDraft() {
    try {
      const saved = localStorage.getItem('ssbFormData')
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Error loading draft:', error)
      return null
    }
  },

  /**
   * Clear draft from localStorage
   */
  clearDraft() {
    try {
      localStorage.removeItem('ssbFormData')
      localStorage.removeItem('ssbCurrentStep')
      return { success: true }
    } catch (error) {
      console.error('Error clearing draft:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Flag an application for admin review
   * @param {string} userId - User ID to get their application
   * @param {string} reason - Reason for flagging
   * @param {string} flaggedCode - Code indicating which nominee is affected
   * @param {string} staffUserId - Staff user ID who flagged it
   * @returns {Promise<Object>} Updated application
   */
  async flagByUserId(userId, reason, flaggedCode, staffUserId) {
    try {
      // Get user's application
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', userId)
      
      if (appError) throw appError
      
      if (!applications || applications.length === 0) {
        throw new Error('User has no application to flag')
      }
      
      const application = applications[0]
      
      // Flag the application
      const { data, error } = await supabase
        .from('applications')
        .update({
          is_flagged: true,
          flagged_reason: reason,
          flagged_code: flaggedCode,
          flagged_at: new Date().toISOString(),
          flagged_by: staffUserId
        })
        .eq('id', application.id)
        .select()
      
      if (error) throw error
      
      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Error flagging application:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all documents for a user from application-documents bucket
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of file objects with metadata and URLs
   */
  async getDocumentsByUserId(userId) {
    try {
      console.log('Attempting to fetch documents from bucket: application-documents, path:', userId)
      
      const { data, error } = await supabase
        .storage
        .from('application-documents')
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        console.error('Storage list error:', error)
        throw error
      }

      console.log(`Found ${data.length} files for user ${userId}`)

      // Filter out placeholder files
      const validFiles = data.filter(file => {
        // Skip placeholder files and empty files
        if (file.name.includes('.emptyFolderPlaceholder') || 
            file.name.startsWith('.') ||
            file.metadata?.size === 0) {
          console.log(`Skipping placeholder/empty file: ${file.name}`)
          return false
        }
        return true
      })

      console.log(`Valid files after filtering: ${validFiles.length}`)

      // Generate public URLs for each file
      const filesWithUrls = validFiles.map(file => {
        const filePath = `${userId}/${file.name}`
        
        // Get public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('application-documents')
          .getPublicUrl(filePath)

        const publicUrl = publicUrlData?.publicUrl
        console.log(`URL for ${file.name}:`, publicUrl)

        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          createdAt: file.created_at,
          url: publicUrl || null,
          isImage: file.name.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/) !== null,
          filePath: filePath
        }
      })

      console.log('Documents prepared:', filesWithUrls)
      return { success: true, data: filesWithUrls }
    } catch (error) {
      console.error('Error fetching documents:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get signed download URL for a document (works for private buckets)
   * @param {string} userId - The user ID
   * @param {string} fileName - The file name
   * @returns {Promise<Object>} Object with signed download URL
   */
  async getSignedDocumentUrl(userId, fileName) {
    try {
      const filePath = `${userId}/${fileName}`
      
      // Get signed URL valid for 1 hour
      const { data, error } = await supabase
        .storage
        .from('application-documents')
        .createSignedUrl(filePath, 3600) // 3600 seconds = 1 hour

      if (error) throw error

      console.log(`Signed URL created for ${fileName}:`, data.signedUrl)
      return { success: true, url: data.signedUrl }
    } catch (error) {
      console.error('Error creating signed URL:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all documents for a user with signed URLs (works for private buckets)
   * @param {string} userId - The user ID
   * @returns {Promise<Array>} Array of file objects with signed URLs
   */
  async getDocumentsByUserIdWithSignedUrls(userId) {
    try {
      console.log('Fetching documents with signed URLs for user:', userId)
      
      const { data, error } = await supabase
        .storage
        .from('application-documents')
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        console.error('Storage list error:', error)
        throw error
      }

      console.log(`Found ${data.length} files for user ${userId}`)

      // Filter out placeholder files and generate signed URLs
      const validFiles = data.filter(file => {
        // Skip placeholder files and empty files
        if (file.name.includes('.emptyFolderPlaceholder') || 
            file.name.startsWith('.') ||
            file.metadata?.size === 0) {
          console.log(`Skipping placeholder/empty file: ${file.name}`)
          return false
        }
        return true
      })

      console.log(`Valid files after filtering: ${validFiles.length}`)

      // Generate signed URLs for each valid file
      const filesWithUrls = await Promise.all(
        validFiles.map(async (file) => {
          const filePath = `${userId}/${file.name}`
          
          // Get signed URL valid for 1 hour
          const { data: signedUrlData, error: signedError } = await supabase
            .storage
            .from('application-documents')
            .createSignedUrl(filePath, 3600)

          let url = null
          if (!signedError) {
            url = signedUrlData?.signedUrl
          } else {
            console.warn(`Failed to create signed URL for ${file.name}:`, signedError)
          }

          return {
            id: file.id,
            name: file.name,
            size: file.metadata?.size || 0,
            createdAt: file.created_at,
            url: url,
            isImage: file.name.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/) !== null,
            filePath: filePath
          }
        })
      )

      console.log('Documents prepared with signed URLs:', filesWithUrls)
      return { success: true, data: filesWithUrls }
    } catch (error) {
      console.error('Error fetching documents:', error)
      return { success: false, error: error.message }
    }
  },
  async getDocumentsByApplicationId(userId, applicationId = null) {
    try {
      const folderPath = applicationId ? `${userId}/${applicationId}` : userId

      const { data, error } = await supabase
        .storage
        .from('application-documents')
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) throw error

      // Generate public URLs for each file
      const filesWithUrls = data.map(file => {
        const filePath = applicationId ? `${userId}/${applicationId}/${file.name}` : `${userId}/${file.name}`
        const { data: publicUrlData } = supabase
          .storage
          .from('application-documents')
          .getPublicUrl(filePath)

        return {
          id: file.id,
          name: file.name,
          size: file.metadata?.size || 0,
          createdAt: file.created_at,
          url: publicUrlData?.publicUrl || null,
          isImage: file.name.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/) !== null
        }
      })

      return { success: true, data: filesWithUrls }
    } catch (error) {
      console.error('Error fetching application documents:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get public URL for a specific document
   * @param {string} userId - The user ID
   * @param {string} fileName - The file name
   * @returns {Promise<Object>} Object with publicUrl
   */
  async getDocumentUrl(userId, fileName) {
    try {
      const { data, error } = supabase
        .storage
        .from('application-documents')
        .getPublicUrl(`${userId}/${fileName}`)

      if (error) throw error

      return { success: true, url: data.publicUrl }
    } catch (error) {
      console.error('Error getting document URL:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete a document from storage
   * @param {string} userId - The user ID
   * @param {string} fileName - The file name
   * @returns {Promise<Object>} Deletion result
   */
  async deleteDocument(userId, fileName) {
    try {
      const { error } = await supabase
        .storage
        .from('application-documents')
        .remove([`${userId}/${fileName}`])

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting document:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all required documents (17 documents) with their status (FOUND or MISSING)
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Array of 17 required documents
   */
  async getRequiredDocuments(userId) {
    try {
      console.log('Fetching required documents for user:', userId)
      
      // Get all files from user folder
      const { data, error } = await supabase
        .storage
        .from('application-documents')
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        })

      if (error) {
        console.error('Storage list error:', error)
        throw error
      }

      console.log(`Found ${data.length} files in storage`)

      // Filter valid files (exclude placeholders and empty files)
      const validFiles = data.filter(file => {
        return !file.name.includes('.emptyFolderPlaceholder') && 
               !file.name.startsWith('.') &&
               (file.metadata?.size || 0) > 0
      })

      console.log(`Valid files: ${validFiles.length}`)

      // Map required documents with their status
      const requiredDocuments = await Promise.all(
        REQUIRED_DOCUMENTS.map(async (docSpec) => {
          // Find file matching this prefix
          const matchingFile = validFiles.find(file => 
            file.name.toLowerCase().startsWith(docSpec.prefix.toLowerCase())
          )

          if (matchingFile) {
            console.log(`Found: ${docSpec.displayName} -> ${matchingFile.name}`)
            
            // Generate signed URL for found file
            const filePath = `${userId}/${matchingFile.name}`
            const { data: signedUrlData, error: signedError } = await supabase
              .storage
              .from('application-documents')
              .createSignedUrl(filePath, 3600)

            return {
              displayName: docSpec.displayName,
              prefix: docSpec.prefix,
              status: 'FOUND',
              fileName: matchingFile.name,
              size: matchingFile.metadata?.size || 0,
              createdAt: matchingFile.created_at,
              url: signedUrlData?.signedUrl || null,
              isImage: matchingFile.name.toLowerCase().match(/\.(png|jpg|jpeg|gif|webp)$/) !== null,
              filePath: filePath
            }
          } else {
            console.log(`Missing: ${docSpec.displayName} (${docSpec.prefix})`)
            
            return {
              displayName: docSpec.displayName,
              prefix: docSpec.prefix,
              status: 'MISSING',
              fileName: null,
              size: 0,
              createdAt: null,
              url: null,
              isImage: false,
              filePath: null
            }
          }
        })
      )

      console.log('Required documents:', requiredDocuments)
      return { success: true, data: requiredDocuments }
    } catch (error) {
      console.error('Error fetching required documents:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Download application PDF from application-forms bucket
   * Note: PDFs are stored in application-forms/{userId}/ not by applicationId
   * @param {string} applicationId - The application ID (for reference)
   * @param {string} userId - The user ID who submitted the application (required to find PDF)
   * @returns {Promise<Object>} Download URL or data
   */
  async downloadApplicationPDF(applicationId, userId) {
    try {
      console.log('Downloading PDF for application:', applicationId, 'user:', userId)
      
      if (!userId) {
        console.error('userId is required to download PDF')
        return { success: false, error: 'User ID required to download PDF' }
      }

      let pdfFile = null
      let filePath = null

      // Look in userId folder (where PDFs are actually stored)
      console.log('Looking in userId folder:', userId)
      const { data: folderList, error: folderError } = await supabase
        .storage
        .from('application-forms')
        .list(userId, {
          limit: 100,
          offset: 0
        })

      if (!folderError && folderList && folderList.length > 0) {
        console.log(`Found ${folderList.length} files in ${userId} folder`)
        pdfFile = folderList.find(file => 
          file.name.toLowerCase().endsWith('.pdf') &&
          !file.name.includes('.')
        )
        if (!pdfFile) {
          pdfFile = folderList.find(file => file.name.toLowerCase().endsWith('.pdf'))
        }
        if (pdfFile) {
          filePath = `${userId}/${pdfFile.name}`
          console.log(`Found PDF: ${filePath}`)
        }
      } else if (folderError) {
        console.warn(`Error listing files in ${userId} folder:`, folderError)
      } else {
        console.warn(`No files found in ${userId} folder`)
      }

      if (!pdfFile) {
        console.warn('No PDF file found for user:', userId)
        return { success: false, error: 'PDF file not found - application may not have been submitted yet' }
      }

      console.log(`Using file path: ${filePath}`)

      // Get signed URL for the PDF
      const { data: signedUrlData, error: signedError } = await supabase
        .storage
        .from('application-forms')
        .createSignedUrl(filePath, 3600) // 1 hour validity

      if (signedError) {
        console.error('Error creating signed URL:', signedError)
        throw signedError
      }
      console.log('PDF signed URL created successfully')

      return { 
        success: true, 
        url: signedUrlData?.signedUrl,
        fileName: pdfFile.name,
        size: pdfFile.metadata?.size || 0
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Open application PDF in new tab
   * @param {string} applicationId - The application ID
   * @param {string} userId - The user ID who submitted the application
   */
  async downloadApplicationPDFDirect(applicationId, userId) {
    try {
      console.log('=== PDF Open Process Started ===')
      console.log('Application ID:', applicationId, 'User ID:', userId)
      
      const result = await this.downloadApplicationPDF(applicationId, userId)
      
      console.log('PDF retrieval result:', result)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      console.log('File retrieved successfully, opening in new tab')
      // Open PDF in new tab instead of downloading
      window.open(result.url, '_blank')

      console.log('=== PDF opened in new tab ===')
      return { success: true }
    } catch (error) {
      console.error('=== Error opening PDF ===', error)
      return { success: false, error: error.message }
    }
  }
}

export default Application
