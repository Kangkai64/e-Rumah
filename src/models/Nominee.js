// src/models/Nominee.js
import { supabase } from '../config/supabase'

class Nominee {
  /**
   * 获取所有被提名人记录
   * @param {Object} filters - 过滤条件
   * @returns {Promise<{success: boolean, data: Array, error: any}>}
   */
  static async getAll(filters = {}) {
    try {
      let query = supabase
        .from('nominees')
        .select(`
          *,
          application:applications(id, application_number, status),
          elder:users!nominees_elder_id_fkey(id, name, ic_number)
        `)
      
      // 添加过滤条件
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      // 排序
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error fetching nominees:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * 根据 ID 获取被提名人详情
   * @param {string} id - 被提名人 ID
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('nominees')
        .select(`
          *,
          application:applications(*),
          elder:users!nominees_elder_id_fkey(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error fetching nominee:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * 根据申请 ID 获取被提名人
   * @param {string} applicationId - 申请 ID
   * @returns {Promise<{success: boolean, data: Array, error: any}>}
   */
  static async getByApplicationId(applicationId) {
    try {
      const { data, error } = await supabase
        .from('nominees')
        .select(`
          *,
          elder:users!nominees_elder_id_fkey(id, name, ic_number, phone)
        `)
        .eq('application_id', applicationId)

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error fetching nominees by application:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * 更新被提名人状态
   * @param {string} id - 被提名人 ID
   * @param {string} status - 新状态
   * @returns {Promise<{success: boolean, data: Object, error: any}>}
   */
  static async updateStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('nominees')
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
      console.error('Error updating nominee status:', error)
      return { success: false, data: null, error }
    }
  }

  /**
   * 搜索被提名人
   * @param {string} searchTerm - 搜索关键词（姓名或 IC）
   * @returns {Promise<{success: boolean, data: Array, error: any}>}
   */
  static async search(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('nominees')
        .select(`
          *,
          application:applications(id, application_number),
          elder:users!nominees_elder_id_fkey(id, name, ic_number)
        `)
        .or(`name.ilike.%${searchTerm}%,ic_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data, error: null }
    } catch (error) {
      console.error('Error searching nominees:', error)
      return { success: false, data: null, error }
    }
  }
}

export default Nominee