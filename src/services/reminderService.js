// Reminders Service - Handle all reminder-related database operations
import { supabase } from '../config/supabase'
import { Reminder } from '../models/Reminder'

class ReminderService {
  // Create a new reminder
  async createReminder(reminderData) {
    try {
      // Validate reminder data
      const validation = Reminder.validate(reminderData)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`)
      }

      // Create reminder instance and convert to database format
      const reminder = new Reminder(reminderData)
      const dbData = reminder.toDatabaseFormat()

      const { data, error } = await supabase
        .from('reminders')
        .insert(dbData)
        .select()
        .single()

      if (error) {
        console.error('Error creating reminder:', error)
        throw new Error(error.message)
      }

      return Reminder.fromDatabase(data)
    } catch (error) {
      console.error('Service error creating reminder:', error)
      throw error
    }
  }

  // Get all reminders for a user
  async getUserReminders(userId, options = {}) {
    try {
      let query = supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category)
      }

      if (options.reminder_type) {
        query = query.eq('reminder_type', options.reminder_type)
      }

      if (options.is_enabled !== undefined) {
        query = query.eq('is_enabled', options.is_enabled)
      }

      // Apply date filters
      if (options.date_from) {
        query = query.gte('reminder_date', options.date_from)
      }

      if (options.date_to) {
        query = query.lte('reminder_date', options.date_to)
      }

      // Apply ordering
      const orderBy = options.orderBy || 'reminder_date'
      const order = options.order || 'asc'
      query = query.order(orderBy, { ascending: order === 'asc' })

      const { data, error } = await query

      if (error) {
        console.error('Error fetching reminders:', error)
        throw new Error(error.message)
      }

      return data.map(row => Reminder.fromDatabase(row))
    } catch (error) {
      console.error('Service error fetching reminders:', error)
      throw error
    }
  }

  // Get reminder by ID
  async getReminderById(reminderId) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('id', reminderId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Reminder not found
        }
        console.error('Error fetching reminder:', error)
        throw new Error(error.message)
      }

      return Reminder.fromDatabase(data)
    } catch (error) {
      console.error('Service error fetching reminder:', error)
      throw error
    }
  }

  // Update a reminder
  async updateReminder(reminderId, updateData) {
    try {
      // Validate update data
      const validation = Reminder.validate({...updateData, user_id: 'temp'}) // temp user_id for validation
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`)
      }

      // Remove user_id from update data if present (shouldn't be updated)
      const { user_id, id, created_at, ...cleanUpdateData } = updateData

      const { data, error } = await supabase
        .from('reminders')
        .update({
          ...cleanUpdateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderId)
        .select()
        .single()

      if (error) {
        console.error('Error updating reminder:', error)
        throw new Error(error.message)
      }

      return Reminder.fromDatabase(data)
    } catch (error) {
      console.error('Service error updating reminder:', error)
      throw error
    }
  }

  // Delete a reminder
  async deleteReminder(reminderId) {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', reminderId)

      if (error) {
        console.error('Error deleting reminder:', error)
        throw new Error(error.message)
      }

      return true
    } catch (error) {
      console.error('Service error deleting reminder:', error)
      throw error
    }
  }

  // Toggle reminder enabled status
  async toggleReminder(reminderId, isEnabled) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .update({ 
          is_enabled: isEnabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderId)
        .select()
        .single()

      if (error) {
        console.error('Error toggling reminder:', error)
        throw new Error(error.message)
      }

      return Reminder.fromDatabase(data)
    } catch (error) {
      console.error('Service error toggling reminder:', error)
      throw error
    }
  }

  // Get upcoming reminders (next 7 days)
  async getUpcomingReminders(userId) {
    try {
      const now = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(now.getDate() + 7)

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .gte('reminder_date', now.toISOString())
        .lte('reminder_date', nextWeek.toISOString())
        .order('reminder_date', { ascending: true })

      if (error) {
        console.error('Error fetching upcoming reminders:', error)
        throw new Error(error.message)
      }

      return data.map(row => Reminder.fromDatabase(row))
    } catch (error) {
      console.error('Service error fetching upcoming reminders:', error)
      throw error
    }
  }

  // Get overdue reminders
  async getOverdueReminders(userId) {
    try {
      const now = new Date()

      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .lt('reminder_date', now.toISOString())
        .order('reminder_date', { ascending: false })

      if (error) {
        console.error('Error fetching overdue reminders:', error)
        throw new Error(error.message)
      }

      return data.map(row => Reminder.fromDatabase(row))
    } catch (error) {
      console.error('Service error fetching overdue reminders:', error)
      throw error
    }
  }

  // Get reminder statistics for dashboard
  async getReminderStatistics(userId) {
    try {
      const now = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(now.getDate() + 7)

      // Get all reminders count
      const { count: totalCount, error: totalError } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_enabled', true)

      // Get upcoming reminders count
      const { count: upcomingCount, error: upcomingError } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .gte('reminder_date', now.toISOString())
        .lte('reminder_date', nextWeek.toISOString())

      // Get overdue reminders count
      const { count: overdueCount, error: overdueError } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .lt('reminder_date', now.toISOString())

      if (totalError || upcomingError || overdueError) {
        console.error('Error fetching reminder statistics:', totalError || upcomingError || overdueError)
        throw new Error('Failed to fetch reminder statistics')
      }

      return {
        total: totalCount || 0,
        upcoming: upcomingCount || 0,
        overdue: overdueCount || 0
      }
    } catch (error) {
      console.error('Service error fetching reminder statistics:', error)
      throw error
    }
  }

  // Mark reminder as notified
  async markAsNotified(reminderId) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .update({ 
          notified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reminderId)
        .select()
        .single()

      if (error) {
        console.error('Error marking reminder as notified:', error)
        throw new Error(error.message)
      }

      return Reminder.fromDatabase(data)
    } catch (error) {
      console.error('Service error marking reminder as notified:', error)
      throw error
    }
  }

  // Create reminder notifications (for advanced scheduling)
  async createReminderNotification(reminderId, scheduledTime, notificationOffset) {
    try {
      const { data, error } = await supabase
        .from('reminder_notifications')
        .insert({
          reminder_id: reminderId,
          scheduled_time: scheduledTime,
          notification_offset: notificationOffset
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating reminder notification:', error)
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error('Service error creating reminder notification:', error)
      throw error
    }
  }
}

// Export singleton instance
export const reminderService = new ReminderService()
export default reminderService