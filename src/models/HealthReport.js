// src/models/HealthReport.js
import { supabase } from '../config/supabase'

const HealthReport = {
  /**
   * Get all flagged health reports
   * @returns {Promise<Object>} { success, data }
   */
  async getFlagged() {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .select(`
          *,
          user:users!health_reports_user_id_fkey (
            id,
            full_name,
            email,
            phone,
            ic_number
          )
        `)
        .eq('health_report_status', 'Flagged')
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching flagged health reports:', error)
      return { success: false, error: error.message, data: [] }
    }
  },

  /**
   * Update health report status
   * @param {string} id - Health report ID
   * @param {string} status - New status
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .update({
          health_report_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()

      if (error) throw error

      return { success: true, data: data[0] }
    } catch (error) {
      console.error('Error updating health report status:', error)
      return { success: false, error: error.message }
    }
  }
}

export default HealthReport
