import { useState, useEffect } from 'react'
import { useAuth } from '../components/context/AuthContext'
import User from '../models/User'
import LoanStatementView from '../views/LoanStatementView'

function UserDashboardController() {
  const { user } = useAuth()
  
  // State management
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    loanOverview: null,
    disbursements: [],
    propertyValue: null,
    payoutDetails: null
  })
  
  // Filter states
  const [disbursementFilter, setDisbursementFilter] = useState('last6months')
  const [payoutType, setPayoutType] = useState('monthly')

  // Load dashboard data on mount
  useEffect(() => {
    if (user?.id) {
      loadDashboardData()
    }
  }, [user])

  // Reload disbursements when filter changes
  useEffect(() => {
    if (user?.id && !loading) {
      loadDisbursements()
    }
  }, [disbursementFilter])

  /**
   * Load all dashboard data
   */
  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await User.getDashboardData(user.id)
      setDashboardData(data)
      
      // Set payout type from data if available
      if (data.payoutDetails?.payoutType) {
        setPayoutType(data.payoutDetails.payoutType)
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load disbursements with current filter
   */
  const loadDisbursements = async () => {
    try {
      const limit = disbursementFilter === 'last6months' ? 6 : 100
      const disbursements = await User.getDisbursements(user.id, { limit })
      setDashboardData(prev => ({
        ...prev,
        disbursements
      }))
    } catch (err) {
      console.error('Failed to load disbursements:', err)
    }
  }

  /**
   * Handle disbursement filter change
   */
  const handleDisbursementFilterChange = (filter) => {
    setDisbursementFilter(filter)
  }

  /**
   * Handle payout type toggle
   */
  const handlePayoutTypeToggle = (type) => {
    setPayoutType(type)
  }

  /**
   * Handle re-estimate property value
   */
  const handleReEstimateProperty = () => {
    // Navigate to property calculator
    window.location.href = '/property-calculator'
  }

  /**
   * Handle view full schedule
   */
  const handleViewFullSchedule = () => {
    // TODO: Navigate to full disbursement schedule page
    console.log('View full schedule clicked')
  }

  /**
   * Handle view property history
   */
  const handleViewPropertyHistory = () => {
    // TODO: Navigate to property valuation history page
    console.log('View property history clicked')
  }

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return 'RM 0'
    return `RM ${parseFloat(amount).toLocaleString('en-MY', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`
  }

  /**
   * Format date
   */
  const formatDate = (date) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  /**
   * Calculate disbursement percentage for chart
   */
  const calculateDisbursementPercentage = () => {
    if (!dashboardData.loanOverview?.totalEligibleAmount) return 0
    return (dashboardData.loanOverview.disbursedToDate / 
            dashboardData.loanOverview.totalEligibleAmount) * 100
  }

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'status-completed'
      case 'scheduled':
      case 'upcoming':
        return 'status-scheduled'
      case 'active & on track':
        return 'status-active'
      default:
        return 'status-default'
    }
  }

  // Props to pass to view
  const viewProps = {
    loading,
    error,
    
    // Loan Overview
    loanOverview: dashboardData.loanOverview,
    disbursementPercentage: calculateDisbursementPercentage(),
    
    // Disbursements
    disbursements: dashboardData.disbursements,
    disbursementFilter,
    onDisbursementFilterChange: handleDisbursementFilterChange,
    
    // Property Value
    propertyValue: dashboardData.propertyValue,
    onReEstimateProperty: handleReEstimateProperty,
    onViewPropertyHistory: handleViewPropertyHistory,
    
    // Payout Details
    payoutDetails: dashboardData.payoutDetails,
    payoutType,
    onPayoutTypeToggle: handlePayoutTypeToggle,
    
    // Utility functions
    formatCurrency,
    formatDate,
    getStatusBadgeClass,
    
    // Actions
    onViewFullSchedule: handleViewFullSchedule
  }

  return <LoanStatementView {...viewProps} />
}

export default UserDashboardController
