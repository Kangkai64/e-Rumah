// Admin Controller
// Manages state and orchestration for admin dashboard
// Coordinates between Admin model and AdminView

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../client_controller/sessionController/AuthContext'
import Admin from '../models/Admin'
import AdminView from '../views/AdminView'

function AdminController() {
  const { user, userRole, loading: authLoading } = useAuth()
  // State management
  const [statistics, setStatistics] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    reportsGenerated: 48
  })
  const [applications, setApplications] = useState([])
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter and search state
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'submitted_at',
    sortOrder: 'desc'
  })

  // Tab states
  const [activeRecordTab, setActiveRecordTab] = useState('applications')
  const [activeDetailTab, setActiveDetailTab] = useState('overview')
  const [reportFilter, setReportFilter] = useState('this_month')

  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusUpdateApp, setStatusUpdateApp] = useState(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusRemarks, setStatusRemarks] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const navigate = useNavigate()

  // Load dashboard data on mount and when auth changes
  useEffect(() => {
    console.log('🔍 AdminController mounting - Auth state:', { 
      user: user?.email, 
      userRole, 
      authLoading 
    })
    
    // Only load data if user is authenticated and confirmed as admin
    if (user && userRole === 'admin') {
      loadDashboardData()
    } else if (user && userRole && userRole !== 'admin') {
      console.warn('⚠️ Non-admin user trying to access admin dashboard:', userRole)
    }
  }, [user, userRole, authLoading]) // Removed filters from dependencies

  // Load dashboard data when filters change (except search - search only triggers on Enter)
  useEffect(() => {
    // Only fetch if user is admin and we're not already loading
    if (user && userRole === 'admin') {
      loadDashboardData()
    }
  }, [filters.status, filters.sortBy, filters.sortOrder, user, userRole])

  /**
   * Load all dashboard data
   */
  const loadDashboardData = async () => {
    console.log('📊 Loading admin dashboard data...')
    setLoading(true)
    setError(null)

    try {
      // Load statistics
      const statsResult = await Admin.getDashboardStats()
      if (statsResult.success) {
        setStatistics({
          ...statsResult.data,
          reportsGenerated: 48 // Mock data
        })
      }

      // Load applications
      const appsResult = await Admin.getAllApplications(filters)
      if (appsResult.success) {
        setApplications(appsResult.data)
      }

      // Load reports
      const reportsResult = await Admin.getReports({ filter: reportFilter })
      if (reportsResult.success) {
        setReports(reportsResult.data)
      }
    } catch (err) {
      setError(err.message)
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle search input change (just updates state, doesn't trigger search)
   */
  const handleSearchChange = (value) => {
    setFilters(prev => ({
      ...prev,
      search: value
    }))
  }

  /**
   * Handle search trigger (Enter key or button click)
   */
  const handleSearch = () => {
    console.log('🔍 Searching for:', filters.search)
    loadDashboardData()
  }

  /**
   * Handle filter field change
   */
  const handleFilterFieldChange = (field) => {
    setFilters({
      ...filters,
      filterField: field
    })
  }

  /**
   * Handle filter value change
   */
  const handleFilterValueChange = (value) => {
    console.log('Filter status changed to:', value)
    setFilters({
      ...filters,
      status: value
    })
  }

  /**
   * Handle sort change - toggles between newest and oldest
   */
  const handleSortChange = (sortBy, sortOrder) => {
    console.log('Sort changed to:', sortOrder === 'desc' ? 'Newest' : 'Oldest')
    setFilters({
      ...filters,
      sortBy: sortBy,
      sortOrder: sortOrder
    })
  }

  /**
   * Handle application row click
   */
  const handleApplicationClick = async (application) => {
    // Load full application details
    const result = await Admin.getApplicationDetails(application.id)
    if (result.success) {
      setSelectedApplication(result.data)
    }
  }

  /**
   * Handle approve application
   */
  const handleApproveApplication = async () => {
    if (!selectedApplication) return

    const result = await Admin.approveApplication(selectedApplication.id)
    if (result.success) {
      alert('Application approved successfully!')
      loadDashboardData() // Refresh data
    } else {
      alert('Error approving application: ' + result.error)
    }
  }

  /**
   * Handle update application status - show modal
   */
  const handleUpdateStatus = async (application) => {
    setStatusUpdateApp(application)
    setNewStatus(application.status)
    setStatusRemarks('')
    setShowStatusModal(true)
  }

  /**
   * Confirm status update
   */
  const handleConfirmStatusUpdate = async () => {
    if (!statusUpdateApp || !newStatus) return

    // Validate status change
    if (newStatus === statusUpdateApp.status) {
      alert('Please select a different status')
      return
    }

    setUpdatingStatus(true)

    try {
      const result = await Admin.updateApplicationStatus(
        statusUpdateApp.id,
        newStatus,
        statusRemarks.trim() || null
      )

      if (result.success) {
        alert('Application status updated successfully!')
        setShowStatusModal(false)
        setStatusUpdateApp(null)
        setNewStatus('')
        setStatusRemarks('')
        loadDashboardData() // Refresh data
      } else {
        alert('Error updating status: ' + result.error)
      }
    } catch (err) {
      alert('Error updating status: ' + err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  /**
   * Cancel status update
   */
  const handleCancelStatusUpdate = () => {
    setShowStatusModal(false)
    setStatusUpdateApp(null)
    setNewStatus('')
    setStatusRemarks('')
  }

  // Add escape key handler for status modal
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showStatusModal && !updatingStatus) {
        handleCancelStatusUpdate()
      }
    }

    if (showStatusModal) {
      document.addEventListener('keydown', handleEscapeKey)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = 'unset'
    }
  }, [showStatusModal, updatingStatus])

  /**
   * Handle view application details (navigate to review page)
   */
  const handleReviewApplication = async (application) => {
    // If application status is 'submitted', automatically change to 'underReviewed'
    if (application.status === 'submitted') {
      try {
        console.log('📝 Auto-updating status from submitted to underReviewed')
        const result = await Admin.updateApplicationStatus(
          application.id,
          'underReviewed',
          'Application moved to review by admin'
        )

        if (!result.success) {
          console.error('Failed to update status:', result.error)
          // Still navigate even if status update fails
        } else {
          console.log('✅ Status updated successfully')
        }
      } catch (err) {
        console.error('Error updating application status:', err)
        // Still navigate even if error occurs
      }
    }

    // Navigate to review page
    navigate(`/admin/review/${application.id}`)
  }

  /**
   * Handle generate report
   */
  const handleGenerateReport = async () => {
    const result = await Admin.generateReport()
    if (result.success) {
      alert('Report generation initiated!')
      loadDashboardData()
    } else {
      alert('Error generating report: ' + result.error)
    }
  }

  /**
   * Handle report actions
   */
  const handleViewReport = (reportId) => {
    console.log('View report:', reportId)
    // Implement report viewing logic
  }

  const handleShareReport = (reportId) => {
    console.log('Share report:', reportId)
    // Implement report sharing logic
  }

  const handleArchiveReport = (reportId) => {
    console.log('Archive report:', reportId)
    // Implement report archiving logic
  }

  /**
   * Format date helper
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  /**
   * Get status badge class
   */
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'submitted':
      case 'underReviewed':
        return 'pending'
      case 'approved':
        return 'approved'
      case 'rejected':
        return 'rejected'
      default:
        return ''
    }
  }

  /**
   * Get status display text
   */
  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'submitted':
        return 'Submitted'
      case 'underReviewed':
        return 'Under Review'
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
      case 'terminated':
        return 'Terminated'
      default:
        return status
    }
  }

  // Pass all data and handlers to View
  return (
    <AdminView
      statistics={statistics}
      applications={applications}
      selectedApplication={selectedApplication}
      reports={reports}
      loading={loading}
      error={error}
      filters={filters}
      activeRecordTab={activeRecordTab}
      activeDetailTab={activeDetailTab}
      reportFilter={reportFilter}
      showStatusModal={showStatusModal}
      statusUpdateApp={statusUpdateApp}
      newStatus={newStatus}
      statusRemarks={statusRemarks}
      updatingStatus={updatingStatus}
      onSearchChange={handleSearchChange}
      onSearch={handleSearch}
      onFilterFieldChange={handleFilterFieldChange}
      onFilterValueChange={handleFilterValueChange}
      onSortChange={handleSortChange}
      onApplicationClick={handleApplicationClick}
      onApproveApplication={handleApproveApplication}
      onUpdateStatus={handleUpdateStatus}
      onReviewApplication={handleReviewApplication}
      onGenerateReport={handleGenerateReport}
      onViewReport={handleViewReport}
      onShareReport={handleShareReport}
      onArchiveReport={handleArchiveReport}
      onRecordTabChange={setActiveRecordTab}
      onDetailTabChange={setActiveDetailTab}
      onReportFilterChange={setReportFilter}
      onStatusChange={setNewStatus}
      onStatusRemarksChange={setStatusRemarks}
      onConfirmStatusUpdate={handleConfirmStatusUpdate}
      onCancelStatusUpdate={handleCancelStatusUpdate}
      formatDate={formatDate}
      getStatusBadgeClass={getStatusBadgeClass}
      getStatusDisplayText={getStatusDisplayText}
    />
  )
}

export default AdminController
