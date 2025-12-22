// Admin Report Controller 
// Handles admin-specific health report management AND application review functionality
// Focuses on admin actions: approve, flag, archive health reports + review applications

import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../client_controller/sessionController/AuthContext'
import {
  getAllHealthReports,
  approveHealthReport,
  flagHealthReport,
  archiveHealthReport,
  getAdminStatistics
} from '../models/HealthReport'
import Admin from '../models/Admin'
import Application from '../models/Application'
import { supabase } from '../config/supabase'
import AdminApplicationReviewView from '../views/AdminApplicationReviewView'

function AdminReportController({ mode = 'reports' }) {
  const { applicationId } = useParams()
  const navigate = useNavigate()
  const { user, userRole } = useAuth()
  
  // Common state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  
  // Health Reports state
  const [statistics, setStatistics] = useState({
    pending: 0,
    reviewed: 0,
    flagged: 0,
    generated: 0
  })
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  
  // Application Review state
  const [application, setApplication] = useState(null)
  const [documents, setDocuments] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  
  // Document flagging state
  const [showFlagDocumentModal, setShowFlagDocumentModal] = useState(false)
  const [flaggedDocument, setFlaggedDocument] = useState(null)
  const [flagDocumentReason, setFlagDocumentReason] = useState('')
  const [flaggingDocument, setFlaggingDocument] = useState(false)

  // PDF Viewer state
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [viewingDocumentUrl, setViewingDocumentUrl] = useState(null)
  const [viewingDocumentName, setViewingDocumentName] = useState(null)

  // Filters and search (for reports)
  const [searchKey, setSearchKey] = useState('')
  const [filters, setFilters] = useState({
    field: 'status',
    value: 'Pending'
  })
  const [sortBy, setSortBy] = useState('newest')
  const [sortOrder, setSortOrder] = useState('desc')
  
  // Modal states for admin actions (reports)
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [actionReport, setActionReport] = useState(null)

  // Load data based on mode
  useEffect(() => {
    if (mode === 'review' && applicationId) {
      fetchApplicationDetails()
    } else if (mode === 'reports' && user && userRole === 'admin') {
      fetchStatistics()
      fetchReports()
    }
  }, [mode, applicationId, user, userRole])

  // ============================================================================
  // APPLICATION REVIEW FUNCTIONS
  // ============================================================================

  const fetchApplicationDetails = async () => {
    if (!applicationId) return
    
    setIsLoading(true)
    try {
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          users!applications_user_id_fkey (
            id,
            full_name,
            ic_number,
            email,
            phone
          ),
          application_data (
            *
          ),
          properties (
            id,
            property_type,
            address,
            postcode,
            indicative_market_value,
            valuation_date,
            expected_market_value,
            purchase_price,
            purchase_date,
            tenure_title,
            expiry_date,
            build_up_area,
            land_area,
            is_encumbered,
            bank_name,
            est_outstanding_balance
          ),
          nominees (
            id,
            type,
            name,
            ic_number,
            address,
            postcode,
            email,
            residence_phone,
            telephone,
            sex,
            race,
            is_malaysian,
            marital_status,
            relationship,
            created_at,
            updated_at,
            dob
          )
        `)
        .eq('id', applicationId)
        .single()

      if (appError) throw appError

      // Process application_data
      if (appData.application_data && Array.isArray(appData.application_data)) {
        appData.application_data = appData.application_data[0]
      }

      setApplication(appData)

      // Fetch documents
      if (appData.user_id) {
        const documentsResult = await Application.getRequiredDocuments(
          appData.user_id,
          appData.submitted_form_data
        )
        if (documentsResult.success) {
          setDocuments(documentsResult.data)
        }
      }

      setError(null)
    } catch (err) {
      console.error('Error fetching application:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  const handleApprove = async () => {
    setApprovalLoading(true)
    try {
      const result = await Admin.approveApplication(applicationId)
      if (result.success) {
        alert('Application approved successfully!')
        navigate('/admin/dashboard')
      } else {
        alert('Error approving application: ' + result.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleReject = () => {
    setShowRejectModal(true)
  }

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    setApprovalLoading(true)
    try {
      const result = await Admin.rejectApplication(applicationId, rejectionReason)
      if (result.success) {
        alert('Application rejected successfully!')
        navigate('/admin/dashboard')
      } else {
        alert('Error rejecting application: ' + result.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setApprovalLoading(false)
      setShowRejectModal(false)
      setRejectionReason('')
    }
  }

  const handleCancelReject = () => {
    setShowRejectModal(false)
    setRejectionReason('')
  }

  const handleRejectionReasonChange = (value) => {
    setRejectionReason(value)
  }

  const handleBackToDashboard = () => {
    navigate('/admin/dashboard')
  }

  const handleViewDocument = (doc) => {
    if (doc && doc.url) {
      setViewingDocumentUrl(doc.url)
      setViewingDocumentName(doc.displayName || 'Document')
      setShowPDFViewer(true)
    }
  }

  const handleClosePDFViewer = () => {
    setShowPDFViewer(false)
    setViewingDocumentUrl(null)
    setViewingDocumentName(null)
  }

  const handleFlagDocument = (doc) => {
    setFlaggedDocument(doc)
    setShowFlagDocumentModal(true)
    setFlagDocumentReason('')
  }

  const handleConfirmFlagDocument = async () => {
    if (!flagDocumentReason.trim() || !flaggedDocument) {
      alert('Please provide a reason for flagging')
      return
    }

    setFlaggingDocument(true)
    try {
      const result = await Application.flagDocument(
        applicationId,
        flaggedDocument.displayName,
        flaggedDocument.filePath,
        flagDocumentReason,
        application.user_id
      )

      if (result.success) {
        alert(result.message || `Document "${flaggedDocument.displayName}" has been flagged and deleted. User will be notified.`)
        
        // Refresh documents
        const documentsResult = await Application.getRequiredDocuments(
          application.user_id,
          application.submitted_form_data
        )
        if (documentsResult.success) {
          setDocuments(documentsResult.data)
        }

        setShowFlagDocumentModal(false)
        setFlaggedDocument(null)
        setFlagDocumentReason('')
      } else {
        alert('Error flagging document: ' + (result.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Error: ' + (err.message || 'Unknown error'))
    } finally {
      setFlaggingDocument(false)
    }
  }

  const handleCancelFlagDocument = () => {
    setShowFlagDocumentModal(false)
    setFlaggedDocument(null)
    setFlagDocumentReason('')
  }

  const handleFlagDocumentReasonChange = (value) => {
    setFlagDocumentReason(value)
  }

  // ============================================================================
  // HEALTH REPORTS FUNCTIONS
  // ============================================================================

  const fetchStatistics = useCallback(async () => {
    try {
      const result = await getAdminStatistics()
      if (result.success) {
        setStatistics(result.data)
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

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const formatCurrency = (value) => {
    if (!value) return 'N/A'
    return `RM ${parseFloat(value).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

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
      default:
        return status
    }
  }

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

  // Render based on mode
  if (mode === 'review') {
    return (
      <AdminApplicationReviewView
        application={application}
        documents={documents}
        loading={isLoading}
        error={error}
        activeTab={activeTab}
        approvalLoading={approvalLoading}
        showRejectModal={showRejectModal}
        rejectionReason={rejectionReason}
        showFlagDocumentModal={showFlagDocumentModal}
        flaggedDocumentName={flaggedDocument?.displayName}
        flagDocumentReason={flagDocumentReason}
        flaggingDocument={flaggingDocument}
        showPDFViewer={showPDFViewer}
        viewingDocumentUrl={viewingDocumentUrl}
        viewingDocumentName={viewingDocumentName}
        onTabChange={handleTabChange}
        onApprove={handleApprove}
        onReject={handleReject}
        onConfirmReject={handleConfirmReject}
        onCancelReject={handleCancelReject}
        onRejectionReasonChange={handleRejectionReasonChange}
        onBackToDashboard={handleBackToDashboard}
        onViewDocument={handleViewDocument}
        onClosePDFViewer={handleClosePDFViewer}
        onFlagDocument={handleFlagDocument}
        onConfirmFlagDocument={handleConfirmFlagDocument}
        onCancelFlagDocument={handleCancelFlagDocument}
        onFlagDocumentReasonChange={handleFlagDocumentReasonChange}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getStatusBadgeClass={getStatusBadgeClass}
        getStatusDisplayText={getStatusDisplayText}
      />
    )
  }

  // Default mode: reports
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
    
    // State setters
    setFlagReason,
    setError,
    setSuccessMessage
  }
}

export default AdminReportController
