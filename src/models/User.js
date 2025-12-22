import { supabase } from '../config/supabase'
import { corsProxyUpdate } from '../services/corsProxyService'

class User {
  /**
   * Get dashboard data for user including loan overview, disbursements, property value
   * @param {string} userId - User ID from auth
   * @returns {Promise<Object>} Dashboard data
   */
  static async getDashboardData(userId) {
    try {
      const [loanOverview, disbursements, propertyValue, payoutDetails] = await Promise.all([
        this.getLoanOverview(userId),
        this.getDisbursements(userId),
        this.getPropertyValue(userId),
        this.getPayoutDetails(userId)
      ])

      return {
        loanOverview,
        disbursements,
        propertyValue,
        payoutDetails
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }

  /**
   * Get loan overview including total eligible amount, disbursed amount, remaining balance, status
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Loan overview data
   */
  static async getLoanOverview(userId) {
    try {
      // Get approved application for user
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          approved_at,
          properties (
            indicative_market_value,
            expected_market_value,
            address,
            property_type,
            valuation_date
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single()

      if (appError) {
        if (appError.code === 'PGRST116') {
          // No approved application found
          return {
            hasLoan: false,
            totalEligibleAmount: 0,
            disbursedToDate: 0,
            remainingBalance: 0,
            status: 'No Active Loan',
            propertyDetails: null
          }
        }
        throw appError
      }

      // Calculate total eligible amount (60% of property value - simplified)
      const propertyValue = application.properties?.expected_market_value || 
                          application.properties?.indicative_market_value || 0
      const totalEligibleAmount = propertyValue * 0.60

      // TODO: Get total disbursed amount from loan_disbursements table when it's implemented
      // For now, set to 0 since transactions table doesn't exist yet
      const disbursedToDate = 0
      const remainingBalance = totalEligibleAmount - disbursedToDate

      return {
        hasLoan: true,
        totalEligibleAmount,
        disbursedToDate,
        remainingBalance,
        status: 'Active & On Track',
        propertyDetails: application.properties ? {
          address: application.properties.address,
          propertyType: application.properties.property_type,
          valuationDate: application.properties.valuation_date
        } : null,
        approvedAt: application.approved_at
      }
    } catch (error) {
      console.error('Error fetching loan overview:', error)
      throw error
    }
  }

  /**
   * Get loan disbursement records
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options { limit: number }
   * @returns {Promise<Array>} Disbursement records
   */
  static async getDisbursements(userId, filters = {}) {
    try {
      const { limit = 6 } = filters

      // Get application ID
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single()

      if (appError || !application) {
        return []
      }

      // TODO: Implement loan_disbursements table
      // For now, return empty array since transactions table doesn't exist yet
      return []

      /* When loan_disbursements table is implemented, use this:
      const { data: disbursements, error: txError } = await supabase
        .from('loan_disbursements')
        .select('*')
        .eq('application_id', application.id)
        .order('disbursement_date', { ascending: false })
        .limit(limit)

      if (txError) throw txError

      return disbursements?.map(d => ({
        date: d.disbursement_date,
        amountReceived: parseFloat(d.amount),
        remaining: parseFloat(d.remaining_balance),
        status: d.status,
        description: d.description
      })) || []
      */
    } catch (error) {
      console.error('Error fetching disbursements:', error)
      throw error
    }
  }

  /**
   * Get property value estimation
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Property value data
   */
  static async getPropertyValue(userId) {
    try {
      const { data: application, error } = await supabase
        .from('applications')
        .select(`
          id,
          properties (
            indicative_market_value,
            expected_market_value,
            valuation_date,
            updated_at
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single()

      if (error || !application?.properties) {
        return {
          currentEstimatedValue: 0,
          lastChecked: null
        }
      }

      return {
        currentEstimatedValue: application.properties.expected_market_value || 
                              application.properties.indicative_market_value || 0,
        lastChecked: application.properties.valuation_date || application.properties.updated_at
      }
    } catch (error) {
      console.error('Error fetching property value:', error)
      throw error
    }
  }

  /**
   * Get payout details including monthly/lump-sum information
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Payout details
   */
  static async getPayoutDetails(userId) {
    try {
      const { data: application, error } = await supabase
        .from('applications')
        .select(`
          id,
          properties (
            expected_market_value,
            indicative_market_value
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'approved')
        .single()

      if (error || !application) {
        return {
          payoutType: 'monthly',
          monthlyAmount: 0,
          startDate: null,
          endDate: null,
          totalMonths: 0,
          nextPayoutDate: null,
          bankAccount: null
        }
      }

      // TODO: Get payout details from loan_disbursements or loan_terms table when implemented
      // For now, calculate basic estimates
      const propertyValue = application.properties?.expected_market_value || 
                           application.properties?.indicative_market_value || 0
      const totalEligibleAmount = propertyValue * 0.60
      const totalMonths = 60 // Default 5 years
      const monthlyAmount = totalEligibleAmount / totalMonths

      return {
        payoutType: 'monthly',
        monthlyAmount,
        startDate: null, // Will be set when loan is activated
        endDate: null,
        totalMonths,
        nextPayoutDate: null,
        bankAccount: null // Will be from user's bank details
      }
    } catch (error) {
      console.error('Error fetching payout details:', error)
      throw error
    }
  }

  /**
   * Get user profile information
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile data
   */
  static async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile
   */
  static async updateProfile(userId, profileData) {
    try {
      const result = await corsProxyUpdate('users', userId, {
        ...profileData,
        updated_at: new Date().toISOString()
      })

      if (!result.success) throw new Error(result.error)
      return result.data
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }
}

export default User
