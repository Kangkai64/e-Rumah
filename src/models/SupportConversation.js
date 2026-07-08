// src/models/SupportConversation.js
import { supabase } from '../config/supabase'

/**
 * SupportConversation Model
 * Generic conversation model for all support entities:
 * - inquiries
 * - applications
 * - nominees
 * - health_reports
 */
class SupportConversation {
  /**
   * Get all conversations for a specific entity
   * @param {string} entityType - 'inquiry', 'application', 'nominee', 'health_report'
   * @param {string} entityId - UUID of the entity
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  static async getByEntity(entityType, entityId) {
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching conversations:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send a new conversation message
   * @param {string} entityType - 'inquiry', 'application', 'nominee', 'health_report'
   * @param {string} entityId - UUID of the entity
   * @param {string} message - Message content
   * @param {string} senderType - 'elder' or 'staff'
   * @param {string} senderId - UUID of the sender (user_id)
   * @param {string} fileUrl - Optional file URL
   * @param {string} fileName - Optional file name
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async send(entityType, entityId, message, senderType, senderId, fileUrl = null, fileName = null) {
    try {
      const payload = {
        entity_type: entityType,
        entity_id: entityId,
        message,
        sender_type: senderType,
        sender_id: senderId
      }

      // Add file fields if provided
      if (fileUrl) {
        payload.file_url = fileUrl
        payload.file_name = fileName || 'attachment'
      }

      const { data, error } = await supabase
        .from('support_conversations')
        .insert(payload)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error sending conversation message:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get conversation count for an entity
   * @param {string} entityType - 'inquiry', 'application', 'nominee', 'health_report'
   * @param {string} entityId - UUID of the entity
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  static async getCount(entityType, entityId) {
    try {
      const { count, error } = await supabase
        .from('support_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)

      if (error) throw error

      return { success: true, count: count || 0 }
    } catch (error) {
      console.error('Error counting conversations:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Subscribe to real-time changes for conversations of a specific entity
   * @param {string} entityType - 'inquiry', 'application', 'nominee', 'health_report'
   * @param {string} entityId - UUID of the entity
   * @param {Function} callback - Callback function to handle new conversations
   * @returns {Object} Subscription object with unsubscribe method
   */
  static subscribeToConversations(entityType, entityId, callback) {
    try {
      // Subscribe to INSERT events on support_conversations table
      const subscription = supabase
        .channel(`conversations:${entityType}:${entityId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'support_conversations',
            // postgres_changes supports only a single filter expression,
            // so filter on entity_id and check entity_type in the handler
            filter: `entity_id=eq.${entityId}`
          },
          async (payload) => {
            if (payload.new?.entity_type !== entityType) return

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
}

export default SupportConversation
