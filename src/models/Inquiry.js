// src/models/Inquiry.js
import { supabase } from '../config/supabase'
import { corsProxyUpdate } from '../services/corsProxyService'

class Inquiry {
  /**
   * Get all inquiries with optional filters
   * @param {Object} filters - Filter conditions { status, sortBy }
   * @returns {Promise<{success: boolean, data: Array, error: any}>}
   */
  static async getAll(filters = {}) {
    try {
      let query = supabase
        .from('customer_support_inquiries')
        .select(`
          *,
          user:users(id, full_name, email, phone)
        `)
      
      // Add status filter
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      // Add subject filter (inquiries | application | nominee)
      if (filters.subject) {
        query = query.eq('subject', filters.subject)
      }

      // Add priority filter
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }

      // Sorting
      const sortBy = filters.sortBy || 'created_at'
      query = query.order(sortBy, { ascending: false })

      const { data, error } = await query

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error fetching inquiries:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * Get a single inquiry by ID
   * @param {string} id - Inquiry ID
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('customer_support_inquiries')
        .select(`
          *,
          user:users(id, full_name, email, phone),
          replies:customer_support_contacts(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error fetching inquiry:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * Create a new inquiry
   * @param {Object} inquiryData - { user_id, application_id, subject, content, status }
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async create(inquiryData) {
    try {
      const { data, error } = await supabase
        .from('customer_support_inquiries')
        .insert([{
          user_id: inquiryData.user_id,
          subject: inquiryData.subject,
          message: inquiryData.message || inquiryData.content, // Map content to message
          status: inquiryData.status || 'pending',
          priority: inquiryData.priority || 'medium',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error creating inquiry:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * Update inquiry status
   * @param {string} id - Inquiry ID
   * @param {string} status - New status (pending, in_progress, resolved)
   * @param {string} internalNote - Internal note (optional)
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async updateStatus(id, status, internalNote = null) {
    try {
      const updateData = { 
        status,
        updated_at: new Date().toISOString()
      }
      
      // Add internal note if provided
      if (internalNote !== null) {
        updateData.internal_note = internalNote
      }
      
      // Set resolved_at when marking as resolved
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      }
      
      // Avoid selecting the row back to prevent 406 when SELECT is restricted by RLS
      const result = await corsProxyUpdate('customer_support_inquiries', id, updateData)

      if (!result.success) throw new Error(result.error)
      
      // Return the result from proxy or construct minimal response
      return { success: true, data: result.data || { id, ...updateData }, error: null }
    } catch (error) {
      console.error('Error updating inquiry status:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * Search inquiries (by subject or message)
   * @param {string} searchTerm - Search keyword
   * @returns {Promise<{success: boolean, data: Array, error: any}>}
   */
  static async search(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('customer_support_inquiries')
        .select(`
          *,
          user:users(id, name, email)
        `)
        .or(`subject.ilike.%${searchTerm}%,message.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error searching inquiries:', error)
      return { success: false, data: null, error }
    }
  }
}

export default Inquiry