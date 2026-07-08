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
import AdminReportView from '../views/AdminReportView'
import { useLocation } from 'react-router-dom'
import { useToast } from '../client_controller/common/ToastContext'

function AdminReportController({ mode = 'reports' }) {
  const { applicationId, reportId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, userRole } = useAuth()
  const { showToast } = useToast()
  
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
  const [approvedAmount, setApprovedAmount] = useState('')
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
  
  // Add state for application PDF viewing
  const [loadingApplicationPDF, setLoadingApplicationPDF] = useState(false)

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

  // Report viewing state (for mode='viewReport')
  const [reportData, setReportData] = useState(null)
  const [report, setReport] = useState(null)

  // Load data based on mode
  useEffect(() => {
    if (mode === 'review' && applicationId) {
      fetchApplicationDetails()
    } else if (mode === 'viewReport') {
      // Get report data from route state
      if (location.state?.reportData) {
        setReportData(location.state.reportData)
        setReport(location.state.report)
        setIsLoading(false)
      } else if (reportId) {
        // Opened directly (e.g. via a shared link) - load the report by ID
        const loadSharedReport = async () => {
          const result = await Admin.getReportById(reportId)
          if (result.success) {
            setReportData(result.data.reportData)
            setReport(result.data.report)
          } else {
            showToast('Report not found', 'error')
            navigate('/admin/dashboard')
          }
          setIsLoading(false)
        }
        loadSharedReport()
      } else {
        // No data provided, redirect back
        navigate('/admin/dashboard')
      }
    } else if (mode === 'reports' && user && userRole === 'admin') {
      fetchStatistics()
      fetchReports()
    }
  }, [mode, applicationId, location.state, user, userRole])

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
    if (application?.status === 'underReviewed' && (!approvedAmount || isNaN(parseFloat(approvedAmount)) || parseFloat(approvedAmount) <= 0)) {
      showToast('Please enter a valid approved amount before approving', 'warning')
      return
    }

    setApprovalLoading(true)
    try {
      const result = await Admin.approveApplication(applicationId, {
        approved_amount: approvedAmount ? parseFloat(approvedAmount) : null
      })
      if (result.success) {
        showToast('Application approved successfully!', 'success')
        navigate('/admin/dashboard')
      } else {
        showToast('Error approving application: ' + result.error, 'error')
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleReject = () => {
    setShowRejectModal(true)
  }

  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'warning')
      return
    }

    setApprovalLoading(true)
    try {
      const result = await Admin.rejectApplication(applicationId, rejectionReason)
      if (result.success) {
        showToast('Application rejected successfully!', 'success')
        navigate('/admin/dashboard')
      } else {
        showToast('Error rejecting application: ' + result.error, 'error')
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error')
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
      showToast('Please provide a reason for flagging', 'warning')
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
        showToast(result.message || `Document "${flaggedDocument.displayName}" has been flagged and deleted. User will be notified.`, 'success')
        
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
        showToast('Error flagging document: ' + (result.error || 'Unknown error'), 'error')
      }
    } catch (err) {
      showToast('Error: ' + (err.message || 'Unknown error'), 'error')
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

  // Add handlers for application PDF
  const handleViewApplicationPDF = async () => {
    if (!application?.id || !application?.user_id) {
      showToast('Application information not available', 'warning')
      return
    }

    setLoadingApplicationPDF(true)
    try {
      // Use Admin model method instead of Application model
      const result = await Admin.getApplicationPDF(
        application.id,
        application.user_id
      )

      if (result.success && result.url) {
        setViewingDocumentUrl(result.url)
        setViewingDocumentName(`Application Form - ${application.users?.full_name || 'User'}`)
        setShowPDFViewer(true)
      } else {
        showToast(result.error || 'Failed to load application PDF', 'error')
      }
    } catch (err) {
      console.error('Error viewing application PDF:', err)
      showToast('Failed to load application PDF', 'error')
    } finally {
      setLoadingApplicationPDF(false)
    }
  }

  const handleDownloadApplicationPDF = async () => {
    if (!application?.id || !application?.user_id) {
      showToast('Application information not available', 'warning')
      return
    }

    setLoadingApplicationPDF(true)
    try {
      // Use Admin model method for direct download
      const result = await Admin.downloadApplicationPDFDirect(
        application.id,
        application.user_id
      )

      if (!result.success) {
        showToast(result.error || 'Failed to download application PDF', 'error')
      }
      // If successful, window.open was already called by the model method
    } catch (err) {
      console.error('Error downloading application PDF:', err)
      showToast('Failed to download application PDF', 'error')
    } finally {
      setLoadingApplicationPDF(false)
    }
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

  // Handlers for report viewing
  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!reportData || !report) {
      showToast('Report data not available', 'warning')
      return
    }

    try {
      // Dynamically import html2canvas and jsPDF
      const { default: html2canvas } = await import('html2canvas')
      const { default: jsPDF } = await import('jspdf')

      // Get the report container element
      const reportElement = document.querySelector('.report-container')
      
      if (!reportElement) {
        showToast('Report element not found', 'error')
        return
      }

      // Hide the no-print elements temporarily
      const noPrintElements = document.querySelectorAll('.no-print')
      noPrintElements.forEach(el => {
        el.style.display = 'none'
      })

      // Capture the report as an image
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      // Restore the no-print elements
      noPrintElements.forEach(el => {
        el.style.display = ''
      })

      // Create PDF from canvas
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Calculate dimensions to fit on page
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      let heightLeft = imgHeight
      let position = 10

      // Add pages for each section of the image
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 20

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
        heightLeft -= pageHeight - 20
      }

      // Generate filename
      const fileName = report?.name 
        ? `${report.name}.pdf` 
        : `Analysis_Report_${new Date().toISOString().slice(0, 10)}.pdf`

      // Download PDF
      pdf.save(fileName)

    } catch (err) {
      console.error('Error downloading PDF:', err)
      showToast('Failed to download report PDF: ' + err.message, 'error')
    }
  }

  // Render based on mode
  if (mode === 'viewReport') {
    if (!reportData) {
      return <div className="loading">Loading report...</div>
    }
    
    return (
      <AdminReportView
        reportData={reportData}
        report={report}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        onBackToDashboard={handleBackToDashboard}
      />
    )
  }

  if (mode === 'review') {
    return (
      <AdminApplicationReviewView
        application={application}
        documents={documents}
        loading={isLoading}
        error={error}
        activeTab={activeTab}
        approvalLoading={approvalLoading}
        approvedAmount={approvedAmount}
        onApprovedAmountChange={setApprovedAmount}
        showRejectModal={showRejectModal}
        rejectionReason={rejectionReason}
        showFlagDocumentModal={showFlagDocumentModal}
        flaggedDocumentName={flaggedDocument?.displayName}
        flagDocumentReason={flagDocumentReason}
        flaggingDocument={flaggingDocument}
        showPDFViewer={showPDFViewer}
        viewingDocumentUrl={viewingDocumentUrl}
        viewingDocumentName={viewingDocumentName}
        loadingApplicationPDF={loadingApplicationPDF}
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
        onViewApplicationPDF={handleViewApplicationPDF}
        onDownloadApplicationPDF={handleDownloadApplicationPDF}
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
