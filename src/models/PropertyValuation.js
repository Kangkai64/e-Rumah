// Property Valuation Model
// Handles admin-scheduled property valuations for applications that were
// submitted without a Valuation Report document (see applicationValidation.js
// formData.valuationReportPending)
// NO imports from other models allowed!

import { supabase } from '../config/supabase'
import { corsProxyUpdate } from '../services/corsProxyService'
import { uploadDocument } from '../services/fileUploadService'
import { sendValuationScheduledEmail, sendValuationCompletedEmail } from '../services/emailService'

const toNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const mapSchedule = (row) => ({
  id: row.id,
  applicationId: row.application_id,
  userId: row.user_id,
  status: row.status,
  scheduledDate: row.scheduled_date,
  valuerName: row.valuer_name || '',
  valuerContact: row.valuer_contact || '',
  locationNotes: row.location_notes || '',
  scheduledBy: row.scheduled_by,
  completedAt: row.completed_at,
  completedBy: row.completed_by,
  resultValue: row.result_value != null ? toNumber(row.result_value) : null,
  cancelledReason: row.cancelled_reason || '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const PropertyValuation = {
  /**
   * Get the current valuation schedule for an application, if any.
   * @param {string} applicationId
   * @returns {Promise<Object>} { success, data: schedule|null }
   */
  async getByApplicationId(applicationId) {
    try {
      const { data, error } = await supabase
        .from('property_valuation_schedules')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error

      return { success: true, data: data ? mapSchedule(data) : null }
    } catch (error) {
      console.error('Error fetching valuation schedule:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Schedule a valuation appointment for an application. Applicant is
   * notified by email on a best-effort basis (a failed email does not fail
   * the scheduling action).
   */
  async scheduleValuation(applicationId, userId, payload = {}) {
    try {
      if (!payload.scheduledDate) {
        return { success: false, error: 'Scheduled date is required' }
      }

      const { data: inserted, error } = await supabase
        .from('property_valuation_schedules')
        .insert([
          {
            application_id: applicationId,
            user_id: userId,
            status: 'scheduled',
            scheduled_date: payload.scheduledDate,
            valuer_name: payload.valuerName || null,
            valuer_contact: payload.valuerContact || null,
            location_notes: payload.locationNotes || null,
            scheduled_by: payload.adminId || null,
          },
        ])
        .select('*')
        .single()

      if (error) throw error

      const schedule = mapSchedule(inserted)

      if (payload.recipientEmail) {
        sendValuationScheduledEmail({
          recipientEmail: payload.recipientEmail,
          recipientName: payload.recipientName,
          scheduledDate: schedule.scheduledDate,
          valuerName: schedule.valuerName,
          locationNotes: schedule.locationNotes,
        }).catch((emailError) => {
          console.error('Error sending valuation scheduled email:', emailError)
        })
      }

      return { success: true, data: schedule }
    } catch (error) {
      console.error('Error scheduling valuation:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Change the date/valuer/notes of an existing (still scheduled) valuation.
   */
  async rescheduleValuation(scheduleId, payload = {}) {
    try {
      const updates = { updated_at: new Date().toISOString() }
      if (payload.scheduledDate) updates.scheduled_date = payload.scheduledDate
      if (payload.valuerName !== undefined) updates.valuer_name = payload.valuerName || null
      if (payload.valuerContact !== undefined) updates.valuer_contact = payload.valuerContact || null
      if (payload.locationNotes !== undefined) updates.location_notes = payload.locationNotes || null

      const { data: updated, error } = await supabase
        .from('property_valuation_schedules')
        .update(updates)
        .eq('id', scheduleId)
        .eq('status', 'scheduled')
        .select('*')
        .maybeSingle()

      if (error) throw error
      if (!updated) {
        return { success: false, error: 'This valuation is no longer scheduled' }
      }

      return { success: true, data: mapSchedule(updated) }
    } catch (error) {
      console.error('Error rescheduling valuation:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Cancel a scheduled valuation (e.g. applicant provided their own report).
   */
  async cancelValuation(scheduleId, reason = '') {
    try {
      const { data: updated, error } = await supabase
        .from('property_valuation_schedules')
        .update({
          status: 'cancelled',
          cancelled_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId)
        .eq('status', 'scheduled')
        .select('*')
        .maybeSingle()

      if (error) throw error
      if (!updated) {
        return { success: false, error: 'This valuation is no longer scheduled' }
      }

      return { success: true, data: mapSchedule(updated) }
    } catch (error) {
      console.error('Error cancelling valuation:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Record the valuer's result: uploads the report file (same storage path
   * the wizard uses, so it shows up automatically via
   * Application.getRequiredDocuments), writes the result onto public.properties,
   * and marks the schedule completed. Applicant is notified by email on a
   * best-effort basis.
   */
  async completeValuation(scheduleId, applicationId, userId, payload = {}) {
    try {
      const resultValue = toNumber(payload.resultValue)
      if (resultValue <= 0) {
        return { success: false, error: 'Valuation result must be greater than zero' }
      }
      if (!payload.reportFile) {
        return { success: false, error: 'Valuation report file is required' }
      }

      const uploadResult = await uploadDocument(payload.reportFile, userId, 'valuationReport')
      if (uploadResult.error) {
        return { success: false, error: uploadResult.error.message || 'Failed to upload valuation report' }
      }

      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id')
        .eq('application_id', applicationId)
        .maybeSingle()

      if (propertyError) throw propertyError
      if (!property) {
        return { success: false, error: 'No property record found for this application' }
      }

      const propertyUpdate = await corsProxyUpdate('properties', property.id, {
        indicative_market_value: resultValue,
        valuation_date: payload.valuationDate || new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      })
      if (!propertyUpdate.success) {
        return { success: false, error: propertyUpdate.error || 'Failed to update property valuation' }
      }

      const { data: updated, error } = await supabase
        .from('property_valuation_schedules')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: payload.adminId || null,
          result_value: resultValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', scheduleId)
        .select('*')
        .single()

      if (error) throw error

      const schedule = mapSchedule(updated)

      if (payload.recipientEmail) {
        sendValuationCompletedEmail({
          recipientEmail: payload.recipientEmail,
          recipientName: payload.recipientName,
          resultValue,
        }).catch((emailError) => {
          console.error('Error sending valuation completed email:', emailError)
        })
      }

      return { success: true, data: schedule }
    } catch (error) {
      console.error('Error completing valuation:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Admin-wide worklist of applicants still waiting on a valuer visit.
   */
  async getPendingSchedules() {
    try {
      const { data, error } = await supabase
        .from('property_valuation_schedules')
        .select(`
          id,
          application_id,
          user_id,
          scheduled_date,
          valuer_name,
          valuer_contact,
          status,
          applications(
            users!applications_user_id_fkey(full_name),
            properties(property_type, address)
          )
        `)
        .eq('status', 'scheduled')
        .order('scheduled_date', { ascending: true })

      if (error) throw error

      const schedules = (data || []).map((row) => ({
        id: row.id,
        applicationId: row.application_id,
        userId: row.user_id,
        scheduledDate: row.scheduled_date,
        valuerName: row.valuer_name || '',
        valuerContact: row.valuer_contact || '',
        applicantName: row.applications?.users?.full_name || 'N/A',
        propertyType: row.applications?.properties?.property_type || 'Property',
        propertyAddress: row.applications?.properties?.address || 'N/A',
      }))

      return { success: true, data: schedules }
    } catch (error) {
      console.error('Error fetching pending valuation schedules:', error)
      return { success: false, error: error.message }
    }
  },
}

export default PropertyValuation
