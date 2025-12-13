// src/models/Inquiry.js
import { supabase } from '../config/supabase'

class Inquiry {
  /**
   * 获取所有询问记录
   * @param {Object} filters - 过滤条件 { status, sortBy }
   * @returns {Promise<{success: boolean, data: Array, error: any}>}
   */
  static async getAll(filters = {}) {
    try {
      let query = supabase
        .from('inquiries')
        .select(`
          *,
          user:users(id, name, email),
          application:applications(id, application_number)
        `)
      
      // 添加状态过滤
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      // 排序
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
   * 根据 ID 获取单个询问详情
   * @param {string} id - 询问 ID
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          user:users(id, name, email, phone),
          application:applications(id, application_number, status),
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
   * 创建新的询问
   * @param {Object} inquiryData - { user_id, application_id, subject, content, status }
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async create(inquiryData) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .insert([{
          ...inquiryData,
          status: inquiryData.status || 'pending',
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
   * 更新询问状态
   * @param {string} id - 询问 ID
   * @param {string} status - 新状态 (pending, in_progress, resolved)
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async updateStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error updating inquiry status:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * 搜索询问（按标题或内容）
   * @param {string} searchTerm - 搜索关键词
   * @returns {Promise<{success: boolean, data: Array, error: any}>}
   */
  static async search(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          user:users(id, name, email)
        `)
        .or(`subject.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
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