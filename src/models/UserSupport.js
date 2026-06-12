// src/models/UserSupport.js
import { supabase } from '../config/supabase'

/**
 * UserSupport Model
 * Handles all user-side support operations including inquiries and conversations
 */
class UserSupport {
  /**
   * Get all inquiries for a specific user
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  static async getUserInquiries(userId) {
    try {
      const { data, error } = await supabase
        .from('customer_support_inquiries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching user inquiries:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Create a new inquiry
   * @param {Object} inquiryData - { user_id, subject, message }
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async createInquiry(inquiryData) {
    try {
      const { data, error } = await supabase
        .from('customer_support_inquiries')
        .insert([{
          user_id: inquiryData.user_id,
          subject: inquiryData.subject, // Category: inquiries, health_report, or nominee
          message: inquiryData.message,
          status: 'open',
          priority: 'medium',
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error creating inquiry:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get all conversations for a specific inquiry
   * @param {string} inquiryId - Inquiry ID
   * @param {string} subject - Inquiry subject to determine entity_type
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  static async getConversations(inquiryId, subject = 'inquiries') {
    try {
      // Map subject to entity_type for customer support compatibility
      let entityType = 'inquiry'
      if (subject === 'health_report') entityType = 'health_report'
      else if (subject === 'nominee') entityType = 'nominee'

      const { data, error } = await supabase
        .from('support_conversations')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', inquiryId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Upload a file to Supabase storage
   * @param {File} file - File object to upload
   * @param {string} userId - User ID for file path organization
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  static async uploadFile(file, userId) {
    try {
      // Generate unique filename
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${timestamp}.${fileExt}`

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('support-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('support-attachments')
        .getPublicUrl(fileName)

      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Error uploading file:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send a message in a conversation
   * @param {Object} messageData - { inquiry_id, sender_id, message, file_url?, file_name?, subject? }
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async sendMessage(messageData) {
    try {
      // Map subject to entity_type for customer support compatibility
      let entityType = 'inquiry'
      if (messageData.subject === 'health_report') entityType = 'health_report'
      else if (messageData.subject === 'nominee') entityType = 'nominee'

      const messagePayload = {
        entity_type: entityType,
        entity_id: messageData.inquiry_id,
        message: messageData.message,
        sender_type: 'elder',
        sender_id: messageData.sender_id,
        created_at: new Date().toISOString()
      }

      // Add file fields if provided
      if (messageData.file_url) {
        messagePayload.file_url = messageData.file_url
        messagePayload.file_name = messageData.file_name || 'attachment'
      }

      const { data, error } = await supabase
        .from('support_conversations')
        .insert(messagePayload)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error sending message:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get a single inquiry by ID
   * @param {string} inquiryId - Inquiry ID
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async getInquiryById(inquiryId) {
    try {
      const { data, error } = await supabase
        .from('customer_support_inquiries')
        .select('*')
        .eq('id', inquiryId)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching inquiry:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Subscribe to real-time changes for conversations of a specific inquiry
   * @param {string} inquiryId - Inquiry ID
   * @param {string} subject - Inquiry subject to determine entity_type
   * @param {Function} callback - Callback function to handle new conversations
   * @returns {Object} Subscription object with unsubscribe method
   */
  static subscribeToConversations(inquiryId, subject, callback) {
    try {
      // Map subject to entity_type
      let entityType = 'inquiry'
      if (subject === 'health_report') entityType = 'health_report'
      else if (subject === 'nominee') entityType = 'nominee'

      // Subscribe to INSERT events on support_conversations table
      const subscription = supabase
        .channel(`user_conversations:${entityType}:${inquiryId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_conversations',
            filter: `entity_type=eq.${entityType},entity_id=eq.${inquiryId}`
          },
          async (payload) => {
            // Fetch the full conversation data with sender info
            const { data, error } = await supabase
              .from('support_conversations')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (!error && data) {
              callback(data)
            }
          }
        )
        .subscribe()

      return subscription
    } catch (error) {
      console.error('Error subscribing to conversations:', error)
      return null
    }
  }

  /**
   * Unsubscribe from conversations
   * @param {Object} subscription - Subscription object returned from subscribeToConversations
   */
  static unsubscribeFromConversations(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }

  /**
   * Subscribe to real-time status changes for a specific inquiry
   * @param {string} inquiryId - Inquiry ID
   * @param {Function} callback - Called with the updated inquiry row
   * @returns {Object} Subscription object
   */
  static subscribeToInquiryStatus(inquiryId, callback) {
    try {
      const subscription = supabase
        .channel(`inquiry_status:${inquiryId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'customer_support_inquiries',
            filter: `id=eq.${inquiryId}`
          },
          (payload) => {
            if (payload.new) callback(payload.new)
          }
        )
        .subscribe()
      return subscription
    } catch (error) {
      console.error('Error subscribing to inquiry status:', error)
      return null
    }
  }

  static unsubscribeFromInquiryStatus(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  }
}

export default UserSupport
