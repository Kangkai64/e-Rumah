// HealthReport Model
// Handles all database operations for health reports
// NO imports from other models allowed!

import { supabase } from '../config/supabase'

const HealthReport = {
  /**
   * Create a new health report in the database
   * @param {Object} reportData - The health report data
   * @returns {Promise<Object>} Created health report record
   */
  async create(reportData) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .insert([{
          user_id: reportData.userId,
          application_id: reportData.applicationId || null,
          report_type: reportData.reportType,
          report_date: reportData.reportDate,
          report_file_url: reportData.reportFileUrl,
          notes: reportData.notes
        }])
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error creating health report:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get health report by ID
   * @param {string} reportId - The health report ID
   * @returns {Promise<Object>} Health report record
   */
  async getById(reportId) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching health report:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get all health reports for a user with filters
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} Array of health reports
   */
  async getByUser(userId, filters = {}) {
    try {
      let query = supabase
        .from('health_reports')
        .select('*')
        .eq('user_id', userId)

      // Apply filters
      if (filters.reportType) {
        query = query.eq('report_type', filters.reportType)
      }

      if (filters.applicationId) {
        query = query.eq('application_id', filters.applicationId)
      }

      if (filters.startDate && filters.endDate) {
        query = query.gte('report_date', filters.startDate)
        query = query.lte('report_date', filters.endDate)
      }

      // Apply sorting
      if (filters.sortBy) {
        const order = filters.sortOrder || 'asc'
        query = query.order(filters.sortBy, { ascending: order === 'asc' })
      } else {
        query = query.order('report_date', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching health reports:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Search health reports
   * @param {string} userId - User ID
   * @param {string} searchKey - Search term
   * @returns {Promise<Object>} Array of matching health reports
   */
  async search(userId, searchKey) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .select('*')
        .eq('user_id', userId)
        .or(`report_type.ilike.%${searchKey}%,notes.ilike.%${searchKey}%`)
        .order('report_date', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error searching health reports:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update health report
   * @param {string} reportId - The health report ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated health report record
   */
  async update(reportId, updates) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .update(updates)
        .eq('id', reportId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error updating health report:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Delete health report
   * @param {string} reportId - The health report ID
   * @returns {Promise<Object>} Success indicator
   */
  async delete(reportId) {
    try {
      // First get the file URL to delete from storage
      const getResult = await this.getById(reportId)

      if (getResult.success && getResult.data.report_file_url) {
        // Extract file path from URL and delete from storage
        const urlParts = getResult.data.report_file_url.split('/')
        const filePath = urlParts.slice(-2).join('/')
        await supabase.storage
          .from('health-reports')
          .remove([filePath])
      }

      const { error } = await supabase
        .from('health_reports')
        .delete()
        .eq('id', reportId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting health report:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Upload health report file to storage
   * @param {string} userId - User ID
   * @param {File} file - File to upload
   * @returns {Promise<Object>} Upload result with file URL
   */
  async uploadFile(userId, file) {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('health-reports')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('health-reports')
        .getPublicUrl(fileName)

      return {
        success: true,
        data: {
          path: data.path,
          url: publicUrl,
          fileName: file.name
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get health reports by application ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object>} Health reports
   */
  async getByApplication(applicationId) {
    try {
      const { data, error } = await supabase
        .from('health_reports')
        .select('*')
        .eq('application_id', applicationId)
        .order('report_date', { ascending: false })

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching reports by application:', error)
      return { success: false, error: error.message }
    }
  }
}

export default HealthReport
