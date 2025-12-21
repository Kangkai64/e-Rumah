// src/models/CustomerSupportContact.js
import { supabase } from '../config/supabase'
import { corsProxyUpdate } from '../services/corsProxyService'

class CustomerSupportContact {
  /**
   * 获取某个询问的所有回复记录
   * @param {string} inquiryId - 询问 ID
   * @returns {Promise<{success: boolean, data: Array, error: any}>}
   */
  static async getByInquiryId(inquiryId) {
    try {
      const { data, error } = await supabase
        .from('customer_support_contacts')
        .select(`
          *,
          support_user:users!customer_support_contacts_support_user_id_fkey(id, full_name)
        `)
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error fetching support contacts:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * 创建新的回复/联系记录
   * @param {Object} contactData - { inquiry_id, support_user_id, message, contact_type }
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async create(contactData) {
    try {
      const { data, error } = await supabase
        .from('customer_support_contacts')
        .insert([{
          ...contactData,
          created_at: new Date().toISOString(),
          contact_type: contactData.contact_type || 'reply' // reply, sms, email
        }])
        .select()
        .single()

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error creating support contact:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * 发送回复并更新询问状态
   * @param {string} inquiryId - 询问 ID
   * @param {string} supportUserId - 客服用户 ID
   * @param {string} message - 回复内容
   * @param {string} contactType - 联系类型 (reply, sms, email)
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async sendReply(inquiryId, supportUserId, message, contactType = 'reply') {
    try {
      // 1. 创建回复记录
      const { data: replyData, error: replyError } = await supabase
        .from('customer_support_contacts')
        .insert([{
          inquiry_id: inquiryId,
          support_user_id: supportUserId,
          message,
          contact_type: contactType,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (replyError) throw replyError

      // 2. 更新询问状态为 in_progress
      const updateResult = await corsProxyUpdate('customer_support_inquiries', inquiryId, {
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })

      if (!updateResult.success) throw new Error(updateResult.error)

      return { success: true, data: replyData, error: null }
    } catch (error) {
      console.error('Error sending reply:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * 获取所有联系记录统计
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async getStats() {
    try {
      const { data, error } = await supabase
        .rpc('get_support_stats') // 需要在 Supabase 创建这个 RPC function
      
      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error fetching support stats:', error)
      return { success: false, data: null, error }
    }
  }
}

export default CustomerSupportContact