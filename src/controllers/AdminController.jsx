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
    reportsGenerated: 0
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

  // Report generation modal state
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportGenerationType, setReportGenerationType] = useState('monthly')
  const [reportGenerating, setReportGenerating] = useState(false)

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

  // Approved amount state
  const [approvedAmount, setApprovedAmount] = useState('')

  // Termination modal state
  const [showTerminationModal, setShowTerminationModal] = useState(false)
  const [terminationAction, setTerminationAction] = useState(null) // 'approve' or 'reject'
  const [terminationAppId, setTerminationAppId] = useState(null)
  const [processingTermination, setProcessingTermination] = useState(false)

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
    
    if (selectedApplication.status === 'underReviewed' && !approvedAmount) {
      alert('Please enter the approved amount')
      return
    }

    const result = await Admin.approveApplication(selectedApplication.id, {
      approved_amount: approvedAmount ? parseFloat(approvedAmount) : null
    })
    if (result.success) {
      alert('Application approved successfully!')
      setApprovedAmount('') // Reset the field
      loadDashboardData() // Refresh data
    } else {
      alert('Error approving application: ' + result.error)
    }
  }

  /**
   * Handle approved amount change
   */
  const handleApprovedAmountChange = (value) => {
    setApprovedAmount(value)
  }

  /**
   * Handle approve termination
   */
  const handleApproveTermination = async (applicationId) => {
    if (!applicationId) return
    
    if (!window.confirm('Are you sure you want to approve the termination request for this application?')) {
      return
    }

    setProcessingTermination(true)
    try {
      const result = await Admin.updateApplicationStatus(applicationId, 'terminated')
      if (result.success) {
        alert('Termination approved successfully!')
        loadDashboardData()
      } else {
        alert('Error approving termination: ' + result.error)
      }
    } catch (err) {
      console.error('Error approving termination:', err)
      alert('Error approving termination: ' + err.message)
    } finally {
      setProcessingTermination(false)
    }
  }

  /**
   * Handle reject termination
   */
  const handleRejectTermination = async (applicationId) => {
    if (!applicationId) return
    
    const reason = window.prompt('Please provide a reason for rejecting the termination request:')
    if (reason === null) return // User cancelled

    setProcessingTermination(true)
    try {
      // Update to clear termination fields, set remarks, and set status back to approved
      const result = await Admin.rejectTermination(applicationId, reason)
      if (result.success) {
        alert('Termination rejected successfully! Application status restored to Approved.')
        loadDashboardData()
      } else {
        alert('Error rejecting termination: ' + result.error)
      }
    } catch (err) {
      console.error('Error rejecting termination:', err)
      alert('Error rejecting termination: ' + err.message)
    } finally {
      setProcessingTermination(false)
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
   * Handle report actions
   */
  const handleViewReport = async (reportId) => {
    try {
      const report = reports.find(r => r.id === reportId)
      if (!report) {
        alert('Report not found')
        return
      }
      
      // For monthly reports, fetch and view data
      if (report.type === 'monthly') {
        const result = await Admin.viewMonthlyReport(report.name)
        if (result.success) {
          // Navigate to report view with data
          navigate(`/admin/report/${reportId}`, { state: { reportData: result.data, report } })
        } else {
          alert('Error loading report: ' + result.error)
        }
      } else if (report.type === 'yearly') {
        const result = await Admin.generateYearlyReport()
        if (result.success) {
          navigate('/admin/report/yearly', { state: { reportData: result.data, report } })
          await loadDashboardData()
        } else {
          alert('Error loading report: ' + result.error)
        }
      }
    } catch (err) {
      console.error('Error viewing report:', err)
      alert('Error viewing report: ' + err.message)
    }
  }

  const handleShareReport = (reportId) => {
    const report = reports.find(r => r.id === reportId)
    if (!report) {
      alert('Report not found')
      return
    }
    
    // Create shareable link
    const shareUrl = `${window.location.origin}/admin/report/${reportId}`
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Report link copied to clipboard!')
    }).catch(err => {
      console.error('Failed to copy:', err)
      alert('Failed to copy link. Please try again.')
    })
  }

  const handleOpenReportGenerator = () => {
    setShowReportModal(true)
    setReportGenerationType('monthly')
  }

  const handleCloseReportGenerator = () => {
    setShowReportModal(false)
    setReportGenerationType('monthly')
  }

  const handleConfirmReportGenerate = async () => {
    try {
      setReportGenerating(true)

      if (reportGenerationType === 'yearly') {
        const result = await Admin.generateYearlyReport()
        if (result.success) {
          navigate('/admin/report/yearly', { state: { reportData: result.data } })
          await loadDashboardData()
        } else {
          alert('Error generating report: ' + result.error)
        }
      } else {
        const result = await Admin.generateMonthlyReport()
        if (result.success) {
          const { year, month, reportId } = result.data
          const reportName = `Monthly Application Report - ${new Date(year, month, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })}`
          navigate(`/admin/report/${reportId}`, { state: { reportData: result.data, report: { id: reportId, name: reportName, type: 'monthly', generatedOn: new Date().toISOString() } } })
          await loadDashboardData()
        } else {
          alert('Error generating report: ' + result.error)
        }
      }
    } catch (err) {
      console.error('Error generating report:', err)
      alert('Error generating report: ' + err.message)
    } finally {
      setReportGenerating(false)
      handleCloseReportGenerator()
    }
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
      approvedAmount={approvedAmount}
      onApprovedAmountChange={handleApprovedAmountChange}
      showTerminationModal={showTerminationModal}
      terminationAction={terminationAction}
      onApproveTermination={handleApproveTermination}
      onRejectTermination={handleRejectTermination}
      onCancelTermination={() => setShowTerminationModal(false)}
      onSearchChange={handleSearchChange}
      onSearch={handleSearch}
      onFilterFieldChange={handleFilterFieldChange}
      onFilterValueChange={handleFilterValueChange}
      onSortChange={handleSortChange}
      onApplicationClick={handleApplicationClick}
      onApproveApplication={handleApproveApplication}
      onUpdateStatus={handleUpdateStatus}
      onReviewApplication={handleReviewApplication}
      onGenerateReport={handleOpenReportGenerator}
      onViewReport={handleViewReport}
      onShareReport={handleShareReport}
      showReportModal={showReportModal}
      reportGenerationType={reportGenerationType}
      reportGenerating={reportGenerating}
      onReportTypeChange={setReportGenerationType}
      onCloseReportModal={handleCloseReportGenerator}
      onConfirmReportGenerate={handleConfirmReportGenerate}
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
