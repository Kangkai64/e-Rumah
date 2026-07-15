// Maintain Application View - Pure Presentational Component
// Displays application details, status, timeline, and actions
// Receives all props from MaintainApplicationController
// NO business logic - only UI rendering
// NO imports from other views allowed!

import { useState } from 'react'
import '../client_controller/application/maintainApplication.css'
import Button from '../client_controller/common/Button'
import Container from '../client_controller/common/Container'
import { supabase } from '../config/supabase'

function MaintainApplicationView({
  isLoading,
  error,
  application,
  applicationStatus,
  approvedAmount,
  paybackAmount = null,
  flaggedCode,
  flaggedReason,
  nomineeChangePending = false,
  nomineeChangeRejectedReason = null,
  timeline,
  documents = [],
  documentsLoading = false,
  documentsError = null,
  valuationSchedule = null,
  userId = null,
  onDocumentUploaded = null,
  downloadingPDF = false,
  pdfError = null,
  onDownloadPDF = null,
  onTerminateApplication,
  onCancelApplication,
  showRejectTerminationReason = true,
  onDismissRejectReason = null,
  mainApplicantDeceased = false,
  onContactSupport = null
}) {
  const [selectedMissingDoc, setSelectedMissingDoc] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showTerminateModal, setShowTerminateModal] = useState(false)
  const [terminationReason, setTerminationReason] = useState('')
  const [terminationReasonError, setTerminationReasonError] = useState(null)
  const [terminatingApp, setTerminatingApp] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationReasonError, setCancellationReasonError] = useState(null)
  const [cancellingApp, setCancellingApp] = useState(false)
  const [showValuationDetailsModal, setShowValuationDetailsModal] = useState(false)

  const handleMissingDocClick = (doc) => {
    setSelectedMissingDoc(doc)
    setUploadError(null)
    setUploadProgress(0)
  }

  const handleTerminateClick = () => {
    setShowTerminateModal(true)
    setTerminationReason('')
    setTerminationReasonError(null)
  }

  const handleTerminateConfirm = async () => {
    if (!terminationReason.trim()) {
      setTerminationReasonError('Please provide a reason for terminating the application.')
      return
    }
    setTerminationReasonError(null)
    setTerminatingApp(true)
    await onTerminateApplication(terminationReason)
    setTerminatingApp(false)
    setShowTerminateModal(false)
  }

  const handleCancelClick = () => {
    setShowCancelModal(true)
    setCancellationReason('')
    setCancellationReasonError(null)
  }

  const handleCancelConfirm = async () => {
    if (!cancellationReason.trim()) {
      setCancellationReasonError('Please provide a reason for cancelling the application.')
      return
    }
    setCancellationReasonError(null)
    setCancellingApp(true)
    await onCancelApplication(cancellationReason)
    setCancellingApp(false)
    setShowCancelModal(false)
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedMissingDoc) return

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 10MB')
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      // Generate file name with prefix and timestamp ID (to match original upload naming)
      const randomId = Date.now() + Math.floor(Math.random() * 1000)
      const fileExtension = file.name.split('.').pop()
      const fileName = `${selectedMissingDoc.prefix}${randomId}.${fileExtension}`
      const filePath = `${userId}/${fileName}`
      console.log(`Uploading: ${fileName}`)

      // Upload file to Supabase storage
      const { data, error: uploadFileError } = await supabase
        .storage
        .from('application-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadFileError) throw uploadFileError

      console.log('Upload successful:', data)

      // Get signed URL for the uploaded file
      const { data: signedUrlData, error: signedError } = await supabase
        .storage
        .from('application-documents')
        .createSignedUrl(filePath, 3600)

      if (signedError) throw signedError

      // Success - close modal and refresh
      setSelectedMissingDoc(null)
      setUploading(false)
      
      if (onDocumentUploaded) {
        onDocumentUploaded()
      }
    } catch (err) {
      console.error('Upload error:', err)
      setUploadError(err.message || 'Failed to upload file')
      setUploading(false)
    }
  }

  const handleUploadClose = () => {
    if (!uploading) {
      setSelectedMissingDoc(null)
      setUploadError(null)
    }
  }

  // Handle navigate to edit nominees in form
  const handleUpdateNomineeInForm = () => {
    // Navigate to application form with editNomineeOnly mode
    const url = `/application/edit-nominees/${application?.id}`
    window.location.href = url
  }

  // Handle promote nominee 2 to nominee 1
  const handlePromoteNominee2 = () => {
    // Navigate to application form to promote nominee 2 with mode 'promoteNominee2'
    const url = `/application/edit-nominees/${application?.id}?promote=true`
    window.location.href = url
  }


  if (isLoading) {
    return (
      <Container>
        <div className="maintain-application-loading">
          <p>Loading application details...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container>
        <div className="maintain-application-error">
          <p className="error-message">{error}</p>
        </div>
      </Container>
    )
  }

  if (!application) {
    return (
      <Container>
        <div className="maintain-application-empty">
          <p>Application not found</p>
        </div>
      </Container>
    )
  }

  const formData = application.submitted_form_data || {}
  const statusColor = getStatusColor(applicationStatus)

  // Helper function to calculate age from DOB
  const calculateAge = (day, month, year) => {
    if (!day || !month || !year) return null
    const birthDate = new Date(year, month - 1, day)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Helper function to calculate property ownership duration
  const calculateOwnershipDuration = (purchaseYear) => {
    if (!purchaseYear) return null
    return new Date().getFullYear() - parseInt(purchaseYear)
  }

  // Build nominees array from individual nominee fields
  const buildNomineesArray = () => {
    const nominees = []
    if (formData.nominee1Name) {
      nominees.push({
        name: formData.nominee1Name,
        nric: formData.nominee1Ic,
        relationship: formData.nominee1Relationship
      })
    }
    if (formData.hasSecondNominee && formData.nominee2Name) {
      nominees.push({
        name: formData.nominee2Name,
        nric: formData.nominee2Ic,
        relationship: formData.nominee2Relationship
      })
    }
    return nominees
  }

  const nominees = buildNomineesArray()
  const applicantAge = calculateAge(formData.dobDay, formData.dobMonth, formData.dobYear)
  const jointApplicantAge = calculateAge(formData.jDobDay, formData.jDobMonth, formData.jDobYear)
  const propertyOwnershipDuration = calculateOwnershipDuration(formData.purchaseYear)

  return (
    <>
      <Container>
      <div className="maintain-application-wrapper">
        {/* Header Section */}
        <div className="maintain-application-header">
          <h1>Application Status</h1>
          <div className={`status-badge ${statusColor}`}>
            {applicationStatus?.toUpperCase()}
          </div>
        </div>

        {/* Auctioning Status Banner */}
        {applicationStatus === 'auctioning' && (
          <div className="auction-status-banner">
            <div className="auction-icon">🏛️</div>
            <div className="auction-message">
              <h3>Application Open for Provider Bidding</h3>
              <p>Your approved application has been opened to reverse mortgage providers. Any offers submitted will appear on your dashboard for you to review and accept.</p>
            </div>
          </div>
        )}

        {/* Termination Status Message */}
        {applicationStatus === 'underReviewed' && application?.termination_submitted_at && (
          <div className="termination-status-banner">
            <div className="termination-icon">⏳</div>
            <div className="termination-message">
              <h3>Application Termination Under Review</h3>
              <p>Your request to terminate this application is currently being reviewed by our admin team. You will be notified once a decision has been made.</p>
              <p className="termination-date">Submitted on: {new Date(application.termination_submitted_at).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        )}

        {/* Terminated Status Banner */}
        {applicationStatus === 'terminated' && (
          <div className="terminated-status-banner">
            <div className="terminated-icon">⚠️</div>
            <div className="terminated-message">
              <h3>Application Terminated</h3>
              {mainApplicantDeceased ? (
                <p>This application was terminated following the passing of the main applicant. Property sale and proceeds distribution to nominees is handled directly by our team outside of this system.</p>
              ) : (
                <p>Your application has been terminated. You are required to pay back the disbursed amount of <strong>RM {formatCurrency(paybackAmount?.totalPayback)}</strong> (including accrued interest) to our organization before you can apply again.</p>
              )}
              {application?.termination_update_at && (
                <p className="terminated-date">Terminated on: {new Date(application.termination_update_at).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
          </div>
        )}

        {/* Cancelled Status Banner */}
        {applicationStatus === 'cancelled' && (
          <div className="terminated-status-banner">
            <div className="terminated-icon">✕</div>
            <div className="terminated-message">
              <h3>Application Cancelled</h3>
              <p>You cancelled this application before it was approved. No amount is owed - you may submit a new application at any time.</p>
              {application?.cancelled_at && (
                <p className="terminated-date">Cancelled on: {new Date(application.cancelled_at).toLocaleDateString('en-MY', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
          </div>
        )}

        {/* Termination Rejection Reason Message */}
        {applicationStatus === 'approved' && application?.reject_termination_reason && showRejectTerminationReason && (
          <div className="rejection-reason-banner">
            <div className="rejection-icon">ℹ️</div>
            <div className="rejection-message">
              <h3>Termination Request Rejected</h3>
              <p><strong>Reason:</strong> {application.reject_termination_reason}</p>
              <p className="rejection-note">Your request to terminate this application has been rejected by the admin team.</p>
            </div>
            <button
              className="rejection-close-btn"
              onClick={onDismissRejectReason}
            >
              OK
            </button>
          </div>
        )}

        {/* Flagged Document Message */}
        {flaggedCode === 'document_flagged' && flaggedReason && (
          <div className="rejection-reason-banner">
            <div className="rejection-icon">⚠️</div>
            <div className="rejection-message">
              <h3>Document Requires Correction</h3>
              <p><strong>Reason:</strong> {flaggedReason}</p>
              <p className="rejection-note">Please upload a corrected copy of the document below. The flagged document has been removed and is shown as missing.</p>
            </div>
          </div>
        )}

        {/* Valuation Report Missing Banner */}
        {documents.find((doc) => doc.displayName === 'Valuation Report')?.status === 'MISSING' && (
          <div className="valuation-status-banner">
            <div className="valuation-banner-icon">
              {valuationSchedule?.status === 'scheduled' ? '📅' : '📋'}
            </div>
            <div className="valuation-banner-message">
              <h3>This application doesn't have a valuation report yet</h3>
              {valuationSchedule?.status === 'scheduled' ? (
                <p>A property valuation visit has already been scheduled. See the details below.</p>
              ) : (
                <p>Our admin team will be in touch to arrange a property valuation visit. You'll be notified once it's scheduled.</p>
              )}
            </div>
            {valuationSchedule?.status === 'scheduled' && (
              <button
                className="valuation-banner-btn"
                onClick={() => setShowValuationDetailsModal(true)}
              >
                View Details
              </button>
            )}
          </div>
        )}

        {/* Application Rejected Message */}
        {applicationStatus === 'rejected' && application?.remarks && (
          <div className="rejection-reason-banner">
            <div className="rejection-icon">❌</div>
            <div className="rejection-message">
              <h3>Application Rejected</h3>
              <p><strong>Reason:</strong> {application.remarks}</p>
              <p className="rejection-note">Please contact customer support if you have any questions about this decision.</p>
            </div>
          </div>
        )}

        <div className="maintain-application-content">
          {/* Left Column - Application Information */}
          <div className="maintain-application-left">
            {/* Application Information Section Header */}
            <section className="maintain-application-section">
              <h2>Application Information</h2>
            </section>

            {/* Personal Details */}
            <section className="maintain-application-section">
              <h3>Personal Details</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="label">Full Name</span>
                  <span className="value">{formData.nameAsPerNRIC || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">NRIC Number</span>
                  <span className="value">{formData.nricNo || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Age</span>
                  <span className="value">{applicantAge ? `${applicantAge} years` : '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Email</span>
                  <span className="value">{formData.email || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Phone Number</span>
                  <span className="value">{formData.telephone || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Marital Status</span>
                  <span className="value">{formData.maritalStatus || '-'}</span>
                </div>
              </div>
            </section>

            {/* Joint Applicant Details (if applicable) */}
            {formData.isJointApplicant && (
              <section className="maintain-application-section">
                <h3>Joint Applicant Details</h3>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="label">Full Name</span>
                    <span className="value">{formData.jName || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">NRIC Number</span>
                    <span className="value">{formData.jIc || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Relationship</span>
                    <span className="value">{formData.jRelationship || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Age</span>
                    <span className="value">{jointApplicantAge ? `${jointApplicantAge} years` : '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Email</span>
                    <span className="value">{formData.jEmail || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Phone Number</span>
                    <span className="value">{formData.jTelephone || '-'}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Property Information */}
            <section className="maintain-application-section">
              <h3>Property Information</h3>
              <div className="info-grid">
                <div className="info-row">
                  <span className="label">Property Address</span>
                  <span className="value">{formData.propertyAddress || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Scheme / Taman Name</span>
                  <span className="value">{formData.propertySchemeName || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">District</span>
                  <span className="value">{formData.propertyDistrict || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Mukim</span>
                  <span className="value">{formData.propertyMukim || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Property Type</span>
                  <span className="value">{formData.propertyType || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Property Age</span>
                  <span className="value">
                    {(() => {
                      const age = valuationSchedule?.status === 'completed' && valuationSchedule?.resultPropertyAge != null
                        ? valuationSchedule.resultPropertyAge
                        : propertyOwnershipDuration
                      return age ? `${age} years` : '-'
                    })()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Estimated Value</span>
                  <span className="value">
                    RM {formatCurrency(
                      valuationSchedule?.status === 'completed' && valuationSchedule?.resultValue != null
                        ? valuationSchedule.resultValue
                        : formData.purchasePrice
                    ) || '-'}
                  </span>
                </div>
              </div>
            </section>

            {/* Nominees */}
            {nominees && nominees.length > 0 && (
              <section className="maintain-application-section">
                <h3>Nominees</h3>
                <div className="nominees-grid">
                  {nominees.map((nominee, index) => {
                    // Determine if this nominee is inactive
                    const isNominee1 = index === 0
                    const isNominee2 = index === 1
                    const isInactive = 
                      (isNominee1 && (flaggedCode === 'nominee1_inactive' || flaggedCode === 'both_nominees_inactive')) ||
                      (isNominee2 && (flaggedCode === 'nominee2_inactive' || flaggedCode === 'both_nominees_inactive'))

                    const isPending = isInactive && nomineeChangePending
                    const statusClass = isPending ? 'nominee-pending' : (isInactive ? 'nominee-inactive' : '')

                    return (
                      <div
                        key={index}
                        className={`nominee-item ${statusClass}`}
                      >
                        {isPending && (
                          <div className="nominee-pending-badge">PENDING REVIEW</div>
                        )}
                        {isInactive && !isPending && (
                          <div className="nominee-inactive-badge">INACTIVE - REQUIRES ACTION</div>
                        )}
                        {isInactive && !isPending && flaggedReason && (
                          <div className="nominee-flagged-reason">
                            <strong>Reason:</strong> {flaggedReason}
                          </div>
                        )}
                        {isPending && (
                          <div className="nominee-pending-message">
                            Your replacement nominee has been submitted and is awaiting review by our support team.
                          </div>
                        )}
                        {isInactive && !isPending && nomineeChangeRejectedReason && (
                          <div className="nominee-flagged-reason">
                            <strong>Nominee change rejected:</strong> {nomineeChangeRejectedReason}
                          </div>
                        )}
                        <div className="nominee-header">NOMINEE {index + 1}</div>

                        <div className="nominee-content">
                          <div className="nominee-row">
                            <span className="label">NAME:</span>
                            <span className="value">{nominee.name || '-'}</span>
                          </div>
                          <div className="nominee-row">
                            <span className="label">NRIC:</span>
                            <span className="value">{nominee.nric || '-'}</span>
                          </div>
                          <div className="nominee-row">
                            <span className="label">RELATIONSHIP:</span>
                            <span className="value">{nominee.relationship || '-'}</span>
                          </div>
                          {isInactive && !isPending && (
                            <div className="nominee-actions">
                              {nominees.length === 2 && isNominee1 && (flaggedCode === 'nominee1_inactive') && (
                                <button
                                  className="btn btn-secondary"
                                  onClick={handlePromoteNominee2}
                                >
                                  Promote Nominee 2 to Nominee 1
                                </button>
                              )}
                              <button
                                className="btn btn-secondary"
                                onClick={handleUpdateNomineeInForm}
                              >
                                Nominate New Nominee
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Application Timeline Section */}
            {timeline.length > 0 && (
              <section className="maintain-application-section">
                <h3>Application Timeline</h3>
                <div className="timeline">
                  {timeline.map((event, index) => (
                    <div key={index} className={`timeline-item ${event.status}`}>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <h4>{event.title}</h4>
                        <p>{formatDate(event.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Application Documents Section */}
            <section className="maintain-application-section documents-section">
              <h3>Application Documents</h3>
              {documentsError && (
                <div className="documents-error">
                  <p>{documentsError}</p>
                </div>
              )}
              {documentsLoading ? (
                <div className="documents-loading">
                  <p>Loading documents...</p>
                </div>
              ) : documents.length > 0 ? (
                <div className="documents-gallery">
                  {documents.map((doc, index) => {
                    const isPendingValuation = doc.displayName === 'Valuation Report' &&
                      doc.status === 'MISSING' &&
                      valuationSchedule?.status === 'scheduled'

                    return (
                    <div key={index} className={`document-item ${doc.status === 'MISSING' ? 'document-missing' : ''}`}>
                      {isPendingValuation ? (
                        // Admin-scheduled valuation - read only, no self-upload
                        <div className="document-missing-content">
                          <div className="missing-icon">📅</div>
                          <div className="missing-text">Valuation Scheduled</div>
                          <p style={{fontSize: '0.85rem', margin: '0.25rem 0 0'}}>
                            {formatDate(valuationSchedule.scheduledDate)}
                          </p>
                          {valuationSchedule.valuerName && (
                            <p style={{fontSize: '0.85rem', margin: 0}}>Valuer: {valuationSchedule.valuerName}</p>
                          )}
                        </div>
                      ) : doc.status === 'MISSING' ? (
                        // Missing Document Display with Upload Button
                        <div
                          className="document-missing-content"
                          onClick={() => handleMissingDocClick(doc)}
                        >
                          <div className="missing-icon">❌</div>
                          <div className="missing-text">MISSING</div>
                          <button className="upload-btn">
                            📤 Upload
                          </button>
                        </div>
                      ) : doc.isImage ? (
                        // Image Document Display
                        <div className="document-image-wrapper">
                          <img 
                            src={doc.url} 
                            alt={doc.fileName}
                            className="document-image"
                            title={doc.fileName}
                          />
                          <div className="document-overlay">
                            <a 
                              href={doc.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="document-link"
                            >
                              View Full Size
                            </a>
                          </div>
                        </div>
                      ) : (
                        // File Document Display
                        <div className="document-file">
                          <div className="file-icon">📄</div>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="file-link"
                          >
                            {doc.fileName}
                          </a>
                        </div>
                      )}
                      <div className="document-info">
                        <p className="file-name">{doc.displayName}</p>
                        {doc.status !== 'MISSING' && (
                          <>
                            <p className="file-size">{(doc.size / 1024).toFixed(2)} KB</p>
                            <p className="file-date">{formatDate(doc.createdAt)}</p>
                          </>
                        )}
                        <p className={`document-status ${doc.status.toLowerCase()}`}>
                          {doc.status}
                        </p>
                      </div>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="documents-empty">
                  <p>No documents found</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Approved Amount & Actions */}
          <div className="maintain-application-right">
            {/* Approved Amount Section */}
            {(applicationStatus === 'approved' || applicationStatus === 'auctioning' || applicationStatus === 'terminated' || (applicationStatus === 'underReviewed' && application?.termination_submitted_at !== null && application?.termination_submitted_at !== undefined)) && (
              <>
                {applicationStatus === 'terminated' && mainApplicantDeceased ? (
                  <section className="maintain-application-section payback-section estate-settlement-section">
                    <h2>ESTATE SETTLEMENT</h2>
                    <p className="estate-settlement-note">
                      This application was terminated following the passing of the
                      main applicant. The property sale and distribution of proceeds
                      to nominees is handled directly by our team and the appointed
                      estate representative outside of this system — no action is
                      required here.
                    </p>
                  </section>
                ) : (
                <section className={`maintain-application-section ${applicationStatus === 'terminated' ? 'payback-section' : 'approved-section'}`}>
                  <h2>{applicationStatus === 'terminated' ? 'PAYBACK AMOUNT' : 'APPROVED AMOUNT'}</h2>
                  <div className={`approved-card ${applicationStatus === 'terminated' ? 'payback-card' : ''}`}>
                    {applicationStatus === 'terminated' ? (
                      <>
                        <div className="approved-item primary-item">
                          <span className="label">AMOUNT TO PAYBACK</span>
                          <span className="amount">
                            RM {formatCurrency(paybackAmount?.totalPayback)}
                          </span>
                        </div>
                        <div className="approved-item">
                          <span className="label">PRINCIPAL DISBURSED</span>
                          <span className="amount">RM {formatCurrency(paybackAmount?.principal)}</span>
                        </div>
                        <div className="approved-item">
                          <span className="label">INTEREST ACCRUED</span>
                          <span className="amount">RM {formatCurrency(paybackAmount?.accruedInterest)}</span>
                        </div>
                        <p className="payback-note">
                          This is the outstanding disbursed amount plus interest owed
                          to the provider — not the full approved facility.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="approved-item primary-item">
                          <span className="label">TOTAL APPROVED</span>
                          <span className="amount">RM {formatCurrency(approvedAmount)}</span>
                        </div>
                        <div className="approved-item">
                          <span className="label">PURCHASE PRICE</span>
                          <span className="amount">RM {formatCurrency(formData.purchasePrice)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  {applicationStatus === 'terminated' && (
                    <button className="btn-payback" onClick={onContactSupport}>
                      Contact Us to Arrange Repayment
                    </button>
                  )}
                </section>
                )}

                {/* Actions Section - Hide when terminated */}
                {applicationStatus !== 'terminated' && (
                <section className="maintain-application-section actions-box-section">
                  <h3 className="actions-title">Actions</h3>
                  <div className="actions-section">
                    <button
                      onClick={onDownloadPDF}
                      disabled={downloadingPDF}
                      className="btn-download-pdf"
                      title="Download application PDF"
                    >
                      {downloadingPDF ? (
                        <>
                          <span className="spinner-small"></span> Downloading...
                        </>
                      ) : (
                        <>↓ Download PDF</>
                      )}
                    </button>
                    {pdfError && (
                      <div className="pdf-error-message">
                        <span className="error-icon">❌</span>
                        {pdfError}
                      </div>
                    )}
                    <button
                      onClick={handleTerminateClick}
                      className="btn-outline-danger"
                      disabled={application?.termination_submitted_at !== null && application?.termination_submitted_at !== undefined}
                      title={application?.termination_submitted_at ? 'Termination request already submitted' : 'Request to terminate this application'}
                    >
                      ✕ Terminate Application
                    </button>
                  </div>
                </section>
                )}
              </>
            )}

            {/* Actions Section for pre-approval applications (submitted / under review, not already mid-termination) */}
            {(applicationStatus === 'submitted' ||
              (applicationStatus === 'underReviewed' && !application?.termination_submitted_at)) && (
              <section className="maintain-application-section actions-box-section">
                <h3 className="actions-title">Actions</h3>
                <div className="actions-section">
                  <button
                    onClick={onDownloadPDF}
                    disabled={downloadingPDF}
                    className="btn-download-pdf"
                    title="Download application PDF"
                  >
                    {downloadingPDF ? (
                      <>
                        <span className="spinner-small"></span> Downloading...
                      </>
                    ) : (
                      <>↓ Download PDF</>
                    )}
                  </button>
                  {pdfError && (
                    <div className="pdf-error-message">
                      <span className="error-icon">❌</span>
                      {pdfError}
                    </div>
                  )}
                  <button
                    onClick={handleCancelClick}
                    className="btn-outline-danger"
                    title="Cancel this application"
                  >
                    ✕ Cancel Application
                  </button>
                </div>
              </section>
            )}

            {/* Need Help Section */}
            <section className="maintain-application-section need-help-section">
              <h3>Need Help?</h3>
              <p>If you have questions about your application, please contact our support team.</p>
              <a href="/user/support" className="support-link">Contact Support →</a>
            </section>
          </div>
        </div>
      </div>
    </Container>

    {/* Upload Modal for Missing Documents - Inline */}
    {selectedMissingDoc && userId && (
      <div className="missing-document-overlay">
        <div className="missing-document-box">
          {/* Close Button */}
          <button 
            className="close-button"
            onClick={handleUploadClose}
            disabled={uploading}
          >
            ✕
          </button>

          {/* Header */}
          <div className="upload-header">
            <div className="icon-warning">⚠️</div>
            <h3>Upload Missing Document</h3>
          </div>

          {/* Document Name */}
          <div className="document-name-section">
            <p className="label">Document Required:</p>
            <p className="name">{selectedMissingDoc.displayName}</p>
          </div>

          {/* Upload Area */}
          <div className="upload-area-overlay">
            <input
              type="file"
              id={`upload-missing-${selectedMissingDoc.displayName.replace(/\s+/g, '-')}`}
              className="file-input-hidden"
              onChange={handleFileUpload}
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            />
            <label 
              htmlFor={`upload-missing-${selectedMissingDoc.displayName.replace(/\s+/g, '-')}`}
              className={`upload-button-overlay ${uploading ? 'uploading' : ''}`}
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  <span>Uploading... {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <span className="upload-icon">📤</span>
                  <span>Click to Upload or Drag File</span>
                </>
              )}
            </label>
            <p className="upload-hint">PDF, JPG, PNG, GIF, WebP (Max 10MB)</p>
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="error-alert">
              <span className="error-icon">❌</span>
              <span className="error-text">{uploadError}</span>
            </div>
          )}

          {/* Info Message */}
          <div className="info-message">
            <span className="info-icon">ℹ️</span>
            <span>File will be uploaded to your application documents</span>
          </div>
        </div>
      </div>
    )}

    {/* Valuation Details Modal */}
    {showValuationDetailsModal && valuationSchedule && (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Property Valuation Details</h3>
          <div className="valuation-details-list">
            <p><strong>Status:</strong> {valuationSchedule.status === 'scheduled' ? 'Scheduled' : valuationSchedule.status}</p>
            <p><strong>Date & Time:</strong> {formatDate(valuationSchedule.scheduledDate)}</p>
            {valuationSchedule.valuerName && (
              <p><strong>Valuer:</strong> {valuationSchedule.valuerName}</p>
            )}
            {valuationSchedule.valuerContact && (
              <p><strong>Valuer Contact:</strong> {valuationSchedule.valuerContact}</p>
            )}
            {valuationSchedule.locationNotes && (
              <p><strong>Notes:</strong> {valuationSchedule.locationNotes}</p>
            )}
          </div>
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowValuationDetailsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Terminate Application Modal */}
    {showTerminateModal && (
      <div className="modal-overlay">
        <div className="modal terminate-modal">
          <h3>Request Application Termination</h3>
          <p>Please provide a reason for terminating your application. Your request will be reviewed by our admin team:</p>
          <textarea
            className="terminate-reason-input"
            placeholder="Enter reason for termination (required)"
            value={terminationReason}
            onChange={(e) => {
              setTerminationReason(e.target.value)
              if (terminationReasonError) setTerminationReasonError(null)
            }}
            rows={5}
          />
          {terminationReasonError && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{terminationReasonError}</span>
            </div>
          )}
          <div className="modal-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowTerminateModal(false)}
              disabled={terminatingApp}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleTerminateConfirm}
              disabled={terminatingApp}
            >
              {terminatingApp ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Cancel Application Modal */}
    {showCancelModal && (
      <div className="modal-overlay">
        <div className="modal terminate-modal">
          <h3>Cancel Application</h3>
          <p>Your application has not been approved yet, so it can be cancelled immediately - no admin review needed. Please provide a reason:</p>
          <textarea
            className="terminate-reason-input"
            placeholder="Enter reason for cancelling (required)"
            value={cancellationReason}
            onChange={(e) => {
              setCancellationReason(e.target.value)
              if (cancellationReasonError) setCancellationReasonError(null)
            }}
            rows={5}
          />
          {cancellationReasonError && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{cancellationReasonError}</span>
            </div>
          )}
          <div className="modal-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowCancelModal(false)}
              disabled={cancellingApp}
            >
              Keep Application
            </button>
            <button
              className="btn btn-danger"
              onClick={handleCancelConfirm}
              disabled={cancellingApp}
            >
              {cancellingApp ? 'Cancelling...' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  )
}

// Helper function to get status color
function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'status-approved'
    case 'auctioning':
      return 'status-auctioning'
    case 'pending':
      return 'status-pending'
    case 'rejected':
      return 'status-rejected'
    case 'terminated':
      return 'status-terminated'
    case 'cancelled':
      return 'status-rejected'
    default:
      return 'status-default'
  }
}

// Helper function to format currency
function formatCurrency(value) {
  if (!value) return '0.00'
  return parseFloat(value).toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default MaintainApplicationView
