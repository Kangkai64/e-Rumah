// Application Service
// Handles all application CRUD operations with Supabase

import { supabase } from '../config/supabase'

/**
 * Get or create application for current user
 * Returns existing draft/active application or creates a new one
 * @param {string} userId - User ID
 * @returns {Promise<{application, applicationData, error}>}
 */
export const getOrCreateApplication = async (userId) => {
  try {
    // 1. Check for existing draft or active application
    const { data: existingApps, error: fetchError } = await supabase
      .from('applications')
      .select('*, application_data(*)')
      .eq('user_id', userId)
      .in('status', ['draft', 'submitted', 'underReviewed', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine
      throw fetchError
    }

    // If found, return it
    if (existingApps) {
      console.log('🔍 Found existing application:', {
        appId: existingApps.id,
        status: existingApps.status,
        application_data_type: typeof existingApps.application_data,
        application_data_length: existingApps.application_data?.length,
        application_data_raw: existingApps.application_data
      })
      
      const appData = Array.isArray(existingApps.application_data) 
        ? existingApps.application_data[0] 
        : existingApps.application_data
      
      console.log('📦 Application data extracted:', {
        id: appData?.id,
        current_step: appData?.current_step,
        form_data_keys: Object.keys(appData?.form_data || {}).length
      })
      
      return {
        application: existingApps,
        applicationData: appData || null,
        error: null
      }
    }

    // 2. No existing application - create new draft
    const { data: newApp, error: appError } = await supabase
      .from('applications')
      .insert({
        user_id: userId,
        status: 'draft'
      })
      .select()
      .single()

    if (appError) throw appError

    // 3. Create application_data record
    const { data: newAppData, error: dataError } = await supabase
      .from('application_data')
      .insert({
        application_id: newApp.id,
        current_step: 1,
        form_data: {}
      })
      .select()
      .single()

    if (dataError) throw dataError

    return {
      application: newApp,
      applicationData: newAppData,
      error: null
    }
  } catch (error) {
    console.error('Error getting/creating application:', error)
    return { application: null, applicationData: null, error }
  }
}

/**
 * Save application data (form_data and current_step)
 * @param {string} applicationId - Application ID
 * @param {object} formData - Form data object
 * @param {number} currentStep - Current step (1-7)
 * @returns {Promise<{data, error}>}
 */
export const saveApplicationData = async (applicationId, formData, currentStep) => {
  try {
    console.log('📤 Supabase update request:', {
      applicationId,
      currentStep,
      formDataKeys: Object.keys(formData),
      formDataSample: JSON.stringify(formData).slice(0, 100) + '...'
    })
    
    const { data, error } = await supabase
      .from('application_data')
      .update({
        form_data: formData,
        current_step: currentStep,
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId)
      .select()
      .single()

    if (error) throw error
    
    console.log('✅ Supabase response:', {
      id: data.id,
      current_step: data.current_step,
      form_data_keys: Object.keys(data.form_data || {}),
      updated_at: data.updated_at
    })

    return { data, error: null }
  } catch (error) {
    console.error('Error saving application data:', error)
    return { data: null, error }
  }
}

/**
 * Load application data for user (for view/maintain operations)
 * Fetches submitted application with all related data
 * @param {string} userId - User ID
 * @returns {Promise<{application, applicationData, error}>}
 */
export const loadApplicationData = async (userId) => {
  try {
    // Fetch the last submitted/underReviewed/approved application for this user
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        *,
        application_data(*)
      `)
      .eq('user_id', userId)
      .in('status', ['submitted', 'underReviewed', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (!application) {
      return {
        application: null,
        applicationData: null,
        error: 'No submitted application found'
      }
    }

    // Extract application_data (it comes as an array)
    const applicationData = Array.isArray(application.application_data)
      ? application.application_data[0]
      : application.application_data

    return {
      application: application,
      applicationData: applicationData,
      error: null
    }
  } catch (error) {
    console.error('Error loading application data:', error)
    return { application: null, applicationData: null, error }
  }
}

/**
 * Submit application (change status to 'submitted')
 * @param {string} applicationId - Application ID
 * @returns {Promise<{data, error}>}
 */
export const submitApplication = async (applicationId) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error submitting application:', error)
    return { data: null, error }
  }
}

/**
 * Get all applications for user
 * @param {string} userId - User ID
 * @returns {Promise<{applications, error}>}
 */
export const getUserApplications = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*, application_data(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { applications: data, error: null }
  } catch (error) {
    console.error('Error fetching user applications:', error)
    return { applications: [], error }
  }
}

/**
 * Delete application (soft delete by updating status)
 * @param {string} applicationId - Application ID
 * @returns {Promise<{error}>}
 */
export const deleteApplication = async (applicationId) => {
  try {
    // Hard delete from database
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error('Error deleting application:', error)
    return { error }
  }
}

/**
 * Update application status
 * @param {string} applicationId - Application ID
 * @param {string} status - New status
 * @param {string} remarks - Optional remarks for rejection/termination
 * @returns {Promise<{data, error}>}
 */
export const updateApplicationStatus = async (applicationId, status, remarks = null) => {
  try {
    const updates = {
      status,
      updated_at: new Date().toISOString()
    }

    if (remarks) {
      updates.remarks = remarks
    }

    if (status === 'submitted') {
      updates.submitted_at = new Date().toISOString()
    } else if (status === 'underReviewed') {
      updates.reviewed_at = new Date().toISOString()
    } else if (status === 'approved') {
      updates.approved_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', applicationId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    console.error('Error updating application status:', error)
    return { data: null, error }
  }
}

// ==========================================
// LOCALSTORAGE FALLBACK FUNCTIONS
// ==========================================

/**
 * Save to localStorage as fallback
 * @param {string} userId - User ID
 * @param {object} formData - Form data
 * @param {number} currentStep - Current step
 */
export const saveToLocalStorage = (userId, formData, currentStep) => {
  try {
    const data = {
      userId,
      formData,
      currentStep,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem('ssbApplicationDraft', JSON.stringify(data))
    localStorage.setItem('ssbCurrentStep', currentStep.toString())
    console.log('✅ Saved to localStorage as fallback')
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

/**
 * Load from localStorage
 * @param {string} userId - User ID
 * @returns {object} {formData, currentStep}
 */
export const loadFromLocalStorage = (userId) => {
  try {
    const saved = localStorage.getItem('ssbApplicationDraft')
    const savedStep = localStorage.getItem('ssbCurrentStep')
    
    if (saved) {
      const data = JSON.parse(saved)
      // Verify it's for the same user
      if (data.userId === userId) {
        return {
          formData: data.formData || {},
          currentStep: parseInt(savedStep) || data.currentStep || 1
        }
      }
    }
    
    return { formData: {}, currentStep: 1 }
  } catch (error) {
    console.error('Error loading from localStorage:', error)
    return { formData: {}, currentStep: 1 }
  }
}

/**
 * Clear localStorage draft
 */
export const clearLocalStorage = () => {
  try {
    localStorage.removeItem('ssbApplicationDraft')
    localStorage.removeItem('ssbCurrentStep')
    console.log('✅ Cleared localStorage')
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

// ==========================================
// NOMINEE AND PROPERTY FUNCTIONS
// ==========================================

/**
 * Create or update nominees from form data
 * @param {string} applicationId - Application ID
 * @param {object} formData - Complete form data
 * @returns {Promise<{nominees, error}>}
 */
export const saveNominees = async (applicationId, formData) => {
  try {
    const nominees = []
    
    // Nominee 1 (required)
    if (formData.nominee1Name && formData.nominee1Ic) {
      // Format DOB as YYYY-MM-DD for database
      let dob1 = null
      if (formData.nominee1DobYear && formData.nominee1DobMonth && formData.nominee1DobDay) {
        dob1 = `${formData.nominee1DobYear}-${formData.nominee1DobMonth.padStart(2, '0')}-${formData.nominee1DobDay.padStart(2, '0')}`
      }

      nominees.push({
        application_id: applicationId,
        type: 'nominee1',
        name: formData.nominee1Name,
        ic_number: formData.nominee1Ic,
        address: formData.nominee1Address || null,
        postcode: formData.nominee1Postcode || null,
        email: formData.nominee1Email || null,
        residence_phone: formData.nominee1ResidencePhone || null,
        telephone: formData.nominee1Telephone || null,
        dob: dob1,
        sex: formData.nominee1Sex || null,
        race: formData.nominee1Race || null,
        is_malaysian: formData.nominee1Malaysian || false,
        marital_status: formData.nominee1Marital || null,
        relationship: formData.nominee1Relationship || null
      })
    }
    
    // Nominee 2 (optional)
    if (formData.nominee2Name && formData.nominee2Ic) {
      // Format DOB as YYYY-MM-DD for database
      let dob2 = null
      if (formData.nominee2DobYear && formData.nominee2DobMonth && formData.nominee2DobDay) {
        dob2 = `${formData.nominee2DobYear}-${formData.nominee2DobMonth.padStart(2, '0')}-${formData.nominee2DobDay.padStart(2, '0')}`
      }

      nominees.push({
        application_id: applicationId,
        type: 'nominee2',
        name: formData.nominee2Name,
        ic_number: formData.nominee2Ic,
        address: formData.nominee2Address || null,
        postcode: formData.nominee2Postcode || null,
        email: formData.nominee2Email || null,
        residence_phone: formData.nominee2ResidencePhone || null,
        telephone: formData.nominee2Telephone || null,
        dob: dob2,
        sex: formData.nominee2Sex || null,
        race: formData.nominee2Race || null,
        is_malaysian: formData.nominee2Malaysian || false,
        marital_status: formData.nominee2Marital || null,
        relationship: formData.nominee2Relationship || null
      })
    }
    
    if (nominees.length === 0) {
      return { nominees: [], error: null }
    }
    
    // Delete existing nominees for this application
    await supabase
      .from('nominees')
      .delete()
      .eq('application_id', applicationId)
    
    // Insert new nominees
    const { data, error } = await supabase
      .from('nominees')
      .insert(nominees)
      .select()
    
    if (error) throw error
    
    console.log('✅ Saved nominees:', data?.length || 0)
    return { nominees: data, error: null }
  } catch (error) {
    console.error('Error saving nominees:', error)
    return { nominees: null, error }
  }
}

/**
 * Create or update property from form data
 * @param {string} applicationId - Application ID
 * @param {object} formData - Complete form data
 * @returns {Promise<{property, error}>}
 */
export const saveProperty = async (applicationId, formData) => {
  try {
    // Helper to format date from day/month/year fields
    const formatDate = (day, month, year) => {
      if (!day || !month || !year) return null
      // Format as YYYY-MM-DD for PostgreSQL DATE type
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
    
    const propertyData = {
      application_id: applicationId,
      property_type: formData.propertyType || null,
      address: formData.propertyAddress || null,
      postcode: formData.propertyPostcode || null,
      indicative_market_value: formData.indicativeMarketValue ? parseFloat(formData.indicativeMarketValue) : null,
      valuation_date: formatDate(formData.valuationDay, formData.valuationMonth, formData.valuationYear),
      expected_market_value: formData.expectedMarketValue ? parseFloat(formData.expectedMarketValue) : null,
      purchase_price: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
      purchase_date: formatDate(formData.purchaseDay, formData.purchaseMonth, formData.purchaseYear),
      tenure_title: formData.tenureTitle || null,
      expiry_date: formatDate(formData.expiryDay, formData.expiryMonth, formData.expiryYear),
      build_up_area: formData.buildUpArea ? parseFloat(formData.buildUpArea) : null,
      land_area: formData.landArea ? parseFloat(formData.landArea) : null,
      is_encumbered: formData.isEncumbered || false,
      bank_name: formData.bankName || null,
      est_outstanding_balance: formData.outstandingBalance ? parseFloat(formData.outstandingBalance) : null,
      has_fire_insurance: formData.hasFireInsurance || false,
      insurance_company: formData.insuranceCompany || null,
      insurance_period_validity: formData.insurancePeriodValidity || null
    }
    
    // Check if property already exists
    const { data: existing } = await supabase
      .from('properties')
      .select('id')
      .eq('application_id', applicationId)
      .single()
    
    let result
    if (existing) {
      // Update existing property
      result = await supabase
        .from('properties')
        .update(propertyData)
        .eq('application_id', applicationId)
        .select()
        .single()
    } else {
      // Insert new property
      result = await supabase
        .from('properties')
        .insert(propertyData)
        .select()
        .single()
    }
    
    if (result.error) throw result.error
    
    console.log('✅ Saved property')
    return { property: result.data, error: null }
  } catch (error) {
    console.error('Error saving property:', error)
    return { property: null, error }
  }
}

/**
 * Submit application - updates status and creates nominee/property records
 * @param {string} applicationId - Application ID
 * @param {object} formData - Complete form data
 * @returns {Promise<{success, error}>}
 */
export const submitApplicationComplete = async (applicationId, formData) => {
  try {
    console.log('📤 Submitting application:', applicationId)
    
    // 1. Save nominees
    const { error: nomineeError } = await saveNominees(applicationId, formData)
    if (nomineeError) {
      console.error('❌ Nominee save failed:', nomineeError)
      throw new Error('Failed to save nominees: ' + nomineeError.message)
    }
    
    // 2. Save property
    const { error: propertyError } = await saveProperty(applicationId, formData)
    if (propertyError) {
      console.error('❌ Property save failed:', propertyError)
      throw new Error('Failed to save property: ' + propertyError.message)
    }
    
    // 3. Update application status to submitted
    const { error: statusError } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', applicationId)
    
    if (statusError) throw statusError
    
    console.log('✅ Application submitted successfully!')
    return { success: true, error: null }
  } catch (error) {
    console.error('Error submitting application:', error)
    return { success: false, error }
  }
}

/**
 * Check if NRIC already exists in the users table using Secure RPC
 * @param {string} nric - NRIC to check
 * @param {string} currentUserId - Current User ID to exclude (optional)
 * @returns {Promise<{exists: boolean, error: any}>}
 */
export const checkDuplicateNRIC = async (nric, currentUserId = null) => {
  try {
    if (!nric) return { exists: false, error: null }
    
    console.log('🔍 Checking duplicate NRIC (RPC):', { nric, exclude: currentUserId })

    // Call the secure RPC function
    const { data: exists, error } = await supabase
      .rpc('check_duplicate_ic', {
        nric_to_check: nric,
        exclude_user_id: currentUserId
      })

    if (error) {
      // console.error('❌ Error checking duplicate NRIC (RPC):', error)
      return { exists: false, error }
    }
    
    // if (exists) {
    //   console.warn('⚠️ Duplicate NRIC found via RPC')
    // } else {
    //   console.log('✅ No duplicate NRIC found')
    // }

    return { exists: !!exists, error: null }
  } catch (error) {
    console.error('Unexpected error checking duplicate NRIC:', error)
    return { exists: false, error }
  }
}

/**
 * Check if Nominee NRIC already exists in nominees table using Secure RPC
 * @param {string} nric - NRIC to check
 * @param {string} currentApplicationId - Current Application ID to exclude (optional)
 * @returns {Promise<{exists: boolean, error: any}>}
 */
export const checkDuplicateNomineeNRIC = async (nric, currentApplicationId = null) => {
  try {
    if (!nric) return { exists: false, error: null }
    
    console.log('🔍 Checking duplicate Nominee NRIC (RPC):', { nric, excludeApp: currentApplicationId })

    const { data: exists, error } = await supabase
      .rpc('check_duplicate_nominee_ic', {
        nric_to_check: nric,
        exclude_application_id: currentApplicationId
      })

    if (error) {
      console.error('❌ Error checking Nominee duplicate (RPC):', error)
      return { exists: false, error }
    }
    
    if (exists) {
      console.warn('⚠️ Duplicate Nominee NRIC found')
    }

    return { exists: !!exists, error: null }
  } catch (error) {
    console.error('Unexpected error checking Nominee duplicate:', error)
    return { exists: false, error }
  }
}
