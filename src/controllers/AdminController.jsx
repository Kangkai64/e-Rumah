// Admin Controller
// Manages state and orchestration for admin dashboard
// Coordinates between Admin model and AdminView

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/context/AuthContext'
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
    status: 'pending',
    search: '',
    sortBy: 'submitted_at',
    sortOrder: 'desc'
  })

  // Tab states
  const [activeRecordTab, setActiveRecordTab] = useState('applications') // applications | nominees
  const [activeDetailTab, setActiveDetailTab] = useState('overview') // overview | documents | nominees
  const [reportFilter, setReportFilter] = useState('this_month')

  const navigate = useNavigate()

  // Load dashboard data on mount and when auth changes
  useEffect(() => {
    console.log('🔍 AdminController mounting - Auth state:', { 
      user: user?.email, 
      userRole, 
      authLoading 
    })
    
    // Only load data if user is authenticated and confirmed as admin
    if (user && userRole === 'admin' && !authLoading) {
      loadDashboardData()
    } else if (user && userRole && userRole !== 'admin') {
      console.warn('⚠️ Non-admin user trying to access admin dashboard:', userRole)
    }
  }, [user, userRole, authLoading]) // Removed filters from dependencies

  // Load dashboard data when filters change
  useEffect(() => {
    if (user && userRole === 'admin' && !loading) {
      loadDashboardData()
    }
  }, [filters.status, filters.search, filters.sortBy, filters.sortOrder])

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
        
        // Auto-select first application if none selected
        if (!selectedApplication && appsResult.data.length > 0) {
          setSelectedApplication(appsResult.data[0])
        }
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
   * Handle search input change
   */
  const handleSearchChange = (e) => {
    setFilters({
      ...filters,
      search: e.target.value
    })
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
    setFilters({
      ...filters,
      status: value
    })
  }

  /**
   * Handle sort change
   */
  const handleSortChange = (sortBy) => {
    setFilters({
      ...filters,
      sortBy: sortBy
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
   * Handle update application status
   */
  const handleUpdateStatus = async (status) => {
    if (!selectedApplication) return

    const remarks = prompt('Enter remarks (optional):')
    const result = await Admin.updateApplicationStatus(selectedApplication.id, status, remarks)
    
    if (result.success) {
      alert('Application status updated successfully!')
      loadDashboardData()
    } else {
      alert('Error updating status: ' + result.error)
    }
  }

  /**
   * Handle view application details (navigate to review page)
   */
  const handleReviewApplication = (application) => {
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
      case 'underReviewed':
        return 'Pending'
      case 'approved':
        return 'Approved'
      case 'rejected':
        return 'Rejected'
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
      onSearchChange={handleSearchChange}
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
      formatDate={formatDate}
      getStatusBadgeClass={getStatusBadgeClass}
      getStatusDisplayText={getStatusDisplayText}
    />
  )
}

export default AdminController
