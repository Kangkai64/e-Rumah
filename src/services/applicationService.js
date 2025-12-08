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
      return {
        application: existingApps,
        applicationData: existingApps.application_data[0] || null,
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

    return { data, error: null }
  } catch (error) {
    console.error('Error saving application data:', error)
    return { data: null, error }
  }
}

/**
 * Load application data for user
 * @param {string} userId - User ID
 * @returns {Promise<{formData, currentStep, application, error}>}
 */
export const loadApplicationData = async (userId) => {
  try {
    const { application, applicationData, error } = await getOrCreateApplication(userId)

    if (error) throw error

    return {
      formData: applicationData?.form_data || {},
      currentStep: applicationData?.current_step || 1,
      application: application,
      error: null
    }
  } catch (error) {
    console.error('Error loading application data:', error)
    return { formData: {}, currentStep: 1, application: null, error }
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
