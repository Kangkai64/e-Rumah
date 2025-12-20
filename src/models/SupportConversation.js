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
        .select(`
          *,
          sender:sender_id (
            id,
            full_name,
            email,
            type
          )
        `)
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
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async send(entityType, entityId, message, senderType, senderId) {
    try {
      const { data, error } = await supabase
        .from('support_conversations')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          message,
          sender_type: senderType,
          sender_id: senderId
        })
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
}

export default SupportConversation
