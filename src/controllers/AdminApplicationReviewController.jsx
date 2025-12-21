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
            )
          `)
          .eq('id', applicationId)
          .single()

        if (appError) throw appError

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
        navigate('/admin')
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
        navigate('/admin')
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
    navigate('/admin')
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
      onTabChange={handleTabChange}
      onApprove={handleApprove}
      onReject={handleReject}
      onConfirmReject={handleConfirmReject}
      onCancelReject={handleCancelReject}
      onRejectionReasonChange={handleRejectionReasonChange}
      onBackToDashboard={handleBackToDashboard}
      onViewDocument={handleViewDocument}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
      getStatusBadgeClass={getStatusBadgeClass}
      getStatusDisplayText={getStatusDisplayText}
    />
  )
}

export default AdminApplicationReviewController
