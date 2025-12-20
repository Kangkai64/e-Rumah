// Admin Report Controller 
// Handles admin-specific health report management functionality
// Focuses on admin actions: approve, flag, archive health reports

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../components/context/AuthContext'
import {
  getAllHealthReports,
  approveHealthReport,
  flagHealthReport,
  archiveHealthReport,
  getAdminStatistics
} from '../models/HealthReport'

function AdminReportController() {
  const { user, userRole } = useAuth()
  
  // Admin state management
  const [isLoading, setIsLoading] = useState(true)
  const [statistics, setStatistics] = useState({
    pending: 0,
    reviewed: 0,
    flagged: 0,
    generated: 0
  })
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  
  // Filters and search
  const [searchKey, setSearchKey] = useState('')
  const [filters, setFilters] = useState({
    field: 'status',
    value: 'Pending'
  })
  const [sortBy, setSortBy] = useState('newest')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Modal states for admin actions
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [actionReport, setActionReport] = useState(null)

  // Data fetching functions
  const fetchStatistics = useCallback(async () => {
    try {
      const result = await getAdminStatistics()
      if (result.success) {
        setStatistics(result.data)
      } else {
        console.error('Failed to fetch statistics:', result.error)
      }
    } catch (err) {
      console.error('Error fetching statistics:', err)
    }
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const filterOptions = {
        searchKey: searchKey || undefined,
        uploadStatus: filters.field === 'status' ? filters.value : undefined,
        reportType: filters.field === 'reportType' ? filters.value : undefined,
        providerName: filters.field === 'provider' ? filters.value : undefined,
        sortBy: sortBy === 'newest' ? 'created_at' : sortBy,
        sortOrder: sortBy === 'newest' ? 'desc' : sortOrder,
        showArchived: filters.value === 'Archived'
      }

      const result = await getAllHealthReports(filterOptions)
      if (result.success) {
        setReports(result.data || [])
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch reports')
        setReports([])
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError('Failed to fetch health reports')
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }, [searchKey, filters, sortBy, sortOrder])

  // Initialize data on component mount
  useEffect(() => {
    if (user && userRole === 'admin') {
      fetchStatistics()
      fetchReports()
    }
  }, [user, userRole, fetchStatistics, fetchReports])

  // Admin action handlers
  const handleApproveClick = useCallback((report) => {
    setActionReport(report)
    setShowApprovalConfirm(true)
  }, [])

  const handleApproveConfirm = useCallback(async () => {
    if (!actionReport || !user) return

    try {
      const result = await approveHealthReport(actionReport.id, user.id)
      if (result.success) {
        setSuccessMessage('Health report approved successfully')
        await fetchReports()
        await fetchStatistics()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to approve health report')
      console.error('Error approving report:', err)
    } finally {
      setShowApprovalConfirm(false)
      setActionReport(null)
    }
  }, [actionReport, user, fetchReports, fetchStatistics])

  const handleFlagClick = useCallback((report) => {
    setActionReport(report)
    setFlagReason('')
    setShowFlagModal(true)
  }, [])

  const handleFlagConfirm = useCallback(async () => {
    if (!actionReport || !user || !flagReason.trim()) return

    try {
      const result = await flagHealthReport(actionReport.id, user.id, flagReason)
      if (result.success) {
        setSuccessMessage('Health report flagged successfully')
        await fetchReports()
        await fetchStatistics()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to flag health report')
      console.error('Error flagging report:', err)
    } finally {
      setShowFlagModal(false)
      setActionReport(null)
      setFlagReason('')
    }
  }, [actionReport, user, flagReason, fetchReports, fetchStatistics])

  const handleArchiveClick = useCallback((report) => {
    setActionReport(report)
    setShowArchiveConfirm(true)
  }, [])

  const handleArchiveConfirm = useCallback(async () => {
    if (!actionReport || !user) return

    try {
      const result = await archiveHealthReport(actionReport.id, user.id)
      if (result.success) {
        setSuccessMessage('Health report archived successfully')
        await fetchReports()
        await fetchStatistics()
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to archive health report')
      console.error('Error archiving report:', err)
    } finally {
      setShowArchiveConfirm(false)
      setActionReport(null)
    }
  }, [actionReport, user, fetchReports, fetchStatistics])

  const handleCancelAdminAction = useCallback(() => {
    setShowApprovalConfirm(false)
    setShowArchiveConfirm(false)
    setShowFlagModal(false)
    setActionReport(null)
    setFlagReason('')
  }, [])

  // Filter and search handlers
  const handleFilterChange = useCallback((field, value) => {
    if (field === 'clear') {
      setFilters({ field: 'status', value: 'Pending' })
      setSearchKey('')
    } else {
      setFilters(prev => ({ ...prev, [field]: value }))
    }
  }, [])

  const handleSearchChange = useCallback((value) => {
    setSearchKey(value)
  }, [])

  const handleSort = useCallback((value) => {
    if (value === 'newest' || value === 'oldest') {
      setSortBy('created_at')
      setSortOrder(value === 'newest' ? 'desc' : 'asc')
    } else {
      setSortBy(value)
      setSortOrder('desc')
    }
  }, [])

  const handleReportSelect = useCallback((report) => {
    setSelectedReport(report)
  }, [])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // Return admin health report functions and state
  return {
    // Data state
    isLoading,
    statistics,
    reports,
    selectedReport,
    error,
    successMessage,
    
    // Filter state
    searchKey,
    filters,
    sortBy,
    sortOrder,
    
    // Modal state
    showApprovalConfirm,
    showArchiveConfirm,
    showFlagModal,
    flagReason,
    actionReport,
    
    // Data handlers
    fetchReports,
    fetchStatistics,
    
    // Admin action handlers
    onApproveClick: handleApproveClick,
    onApproveConfirm: handleApproveConfirm,
    onFlagClick: handleFlagClick,
    onFlagConfirm: handleFlagConfirm,
    onArchiveClick: handleArchiveClick,
    onArchiveConfirm: handleArchiveConfirm,
    onCancelAdminAction: handleCancelAdminAction,
    
    // Filter and search handlers
    onFilterChange: handleFilterChange,
    onSearchChange: handleSearchChange,
    onSort: handleSort,
    onReportSelect: handleReportSelect,
    
    // State setters for controlled components
    setFlagReason,
    setError,
    setSuccessMessage
  }
}

export default AdminReportController
