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

      // Get total disbursed amount from transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('application_id', application.id)
        .eq('transaction_type', 'payout')

      if (txError) throw txError

      const disbursedToDate = transactions?.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) || 0
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

      // Get disbursement transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('application_id', application.id)
        .eq('transaction_type', 'payout')
        .order('transaction_date', { ascending: false })
        .limit(limit)

      if (txError) throw txError

      // Calculate remaining balance for each record
      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('amount, transaction_date')
        .eq('application_id', application.id)
        .eq('transaction_type', 'payout')
        .order('transaction_date', { ascending: false })

      let runningTotal = 0
      const disbursements = transactions?.map(tx => {
        const amountReceived = parseFloat(tx.amount)
        
        // Calculate total disbursed up to this date
        const disbursedUpToDate = allTransactions
          ?.filter(t => new Date(t.transaction_date) <= new Date(tx.transaction_date))
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        // Get loan overview to calculate remaining
        const totalEligible = 250000 // This should come from loan overview calculation
        const remaining = totalEligible - disbursedUpToDate

        return {
          date: tx.transaction_date,
          amountReceived,
          remaining,
          status: 'Completed',
          description: tx.description
        }
      }) || []

      return disbursements
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
        .select('id, application_data (form_data)')
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

      // Extract payout preferences from application form data
      const formData = application.application_data?.form_data || {}
      const payoutType = formData.payoutType || 'monthly'
      const monthlyAmount = 2500 // Calculate based on total eligible / term
      const startDate = '2026-01-01' // Should be calculated
      const endDate = '2030-12-31' // Should be calculated
      const totalMonths = 60

      return {
        payoutType,
        monthlyAmount,
        startDate,
        endDate,
        totalMonths,
        nextPayoutDate: '2026-01-02',
        bankAccount: formData.bankAccount || 'Maybank **** 1234'
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
