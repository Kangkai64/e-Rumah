// AdminApplicationReviewController
// Manages state and orchestration for admin application review page
// Coordinates between Admin model and AdminApplicationReviewView

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Admin from '../models/Admin'
import AdminApplicationReviewView from '../views/AdminApplicationReviewView'
import { supabase } from '../config/supabase'
import Application from '../models/Application'

function AdminApplicationReviewController() {
  const { applicationId } = useParams()
  const navigate = useNavigate()

  // State management
  const [application, setApplication] = useState(null)
  const [documents, setDocuments] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [approvalLoading, setApprovalLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showFlagDocumentModal, setShowFlagDocumentModal] = useState(false)
  const [flaggedDocument, setFlaggedDocument] = useState(null)
  const [flagDocumentReason, setFlagDocumentReason] = useState('')
  const [flaggingDocument, setFlaggingDocument] = useState(false)

  // Load application details on mount
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      if (!applicationId) return
      
      setLoading(true)
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

        // Process application_data to extract form_data
        if (appData.application_data && Array.isArray(appData.application_data)) {
          appData.application_data = appData.application_data[0]
        }

        // Debug: Log nominees data
        console.log('📋 Nominees data:', appData.nominees)
        console.log('📋 Nominees count:', appData.nominees?.length || 0)

        setApplication(appData)

        // Fetch actual documents using Application model
        if (appData.user_id) {
          const documentsResult = await Application.getRequiredDocuments(appData.user_id)
          if (documentsResult.success) {
            setDocuments(documentsResult.data)
          }
        }

        setError(null)
      } catch (err) {
        console.error('Error fetching application:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchApplicationDetails()
  }, [applicationId])

  /**
   * Handle tab change
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  /**
   * Handle approve application
   */
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

  /**
   * Handle reject application - show modal
   */
  const handleReject = () => {
    setShowRejectModal(true)
  }

  /**
   * Handle confirm rejection
   */
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

  /**
   * Handle cancel rejection
   */
  const handleCancelReject = () => {
    setShowRejectModal(false)
    setRejectionReason('')
  }

  /**
   * Handle rejection reason change
   */
  const handleRejectionReasonChange = (value) => {
    setRejectionReason(value)
  }

  /**
   * Handle back to dashboard
   */
  const handleBackToDashboard = () => {
    navigate('/admin/dashboard')
  }

  /**
   * Handle view document
   */
  const handleViewDocument = (documentUrl) => {
    if (documentUrl) {
      window.open(documentUrl, '_blank')
    }
  }

  /**
   * Handle flag document - show modal
   */
  const handleFlagDocument = (doc) => {
    setFlaggedDocument(doc)
    setShowFlagDocumentModal(true)
    setFlagDocumentReason('')
  }

  /**
   * Handle confirm flag document
   */
  const handleConfirmFlagDocument = async () => {
    if (!flagDocumentReason.trim() || !flaggedDocument) {
      alert('Please provide a reason for flagging')
      return
    }

    setFlaggingDocument(true)
    try {
      console.log('Flagging document:', flaggedDocument.displayName)
      
      // Import Application model method
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
        const documentsResult = await Application.getRequiredDocuments(application.user_id)
        if (documentsResult.success) {
          setDocuments(documentsResult.data)
        }

        // Close modal
        setShowFlagDocumentModal(false)
        setFlaggedDocument(null)
        setFlagDocumentReason('')
      } else {
        const errorMsg = result.error || 'Unknown error occurred'
        console.error('Flag document error:', errorMsg)
        alert('Error flagging document: ' + errorMsg)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('Error: ' + (err.message || err.toString() || 'Unknown error'))
    } finally {
      setFlaggingDocument(false)
    }
  }

  /**
   * Handle cancel flag document
   */
  const handleCancelFlagDocument = () => {
    setShowFlagDocumentModal(false)
    setFlaggedDocument(null)
    setFlagDocumentReason('')
  }

  /**
   * Handle flag document reason change
   */
  const handleFlagDocumentReasonChange = (value) => {
    setFlagDocumentReason(value)
  }

  /**
   * Format currency helper
   */
  const formatCurrency = (value) => {
    if (!value) return 'N/A'
    return `RM ${parseFloat(value).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
      default:
        return status
    }
  }

  return (
    <AdminApplicationReviewView
      application={application}
      documents={documents}
      loading={loading}
      error={error}
      activeTab={activeTab}
      approvalLoading={approvalLoading}
      showRejectModal={showRejectModal}
      rejectionReason={rejectionReason}
      showFlagDocumentModal={showFlagDocumentModal}
      flaggedDocumentName={flaggedDocument?.displayName}
      flagDocumentReason={flagDocumentReason}
      flaggingDocument={flaggingDocument}
      onTabChange={handleTabChange}
      onApprove={handleApprove}
      onReject={handleReject}
      onConfirmReject={handleConfirmReject}
      onCancelReject={handleCancelReject}
      onRejectionReasonChange={handleRejectionReasonChange}
      onBackToDashboard={handleBackToDashboard}
      onViewDocument={handleViewDocument}
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

export default AdminApplicationReviewController
