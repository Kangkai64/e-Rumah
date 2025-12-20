// Maintain Application View - Pure Presentational Component
// Displays application details, status, timeline, and actions
// Receives all props from MaintainApplicationController
// NO business logic - only UI rendering
// NO imports from other views allowed!

import { useState } from 'react'
import '../components/application/maintainApplication.css'
import Button from '../components/common/Button'
import Container from '../components/common/Container'
import { supabase } from '../config/supabase'

function MaintainApplicationView({
  isLoading,
  error,
  application,
  applicationStatus,
  approvedAmount,
  timeline,
  documents = [],
  documentsLoading = false,
  documentsError = null,
  userId = null,
  onDocumentUploaded = null,
  downloadingPDF = false,
  pdfError = null,
  onDownloadPDF = null,
  onEditApplication,
  onTerminateApplication
}) {
  const [selectedMissingDoc, setSelectedMissingDoc] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleMissingDocClick = (doc) => {
    setSelectedMissingDoc(doc)
    setUploadError(null)
    setUploadProgress(0)
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
                  <span className="label">Dependents</span>
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
                  <span className="label">Property Type</span>
                  <span className="value">{formData.propertyType || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Property Age</span>
                  <span className="value">{propertyOwnershipDuration ? `${propertyOwnershipDuration} years` : '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Estimated Value</span>
                  <span className="value">RM {formatCurrency(formData.purchasePrice) || '-'}</span>
                </div>
              </div>
            </section>

            {/* Nominees */}
            {nominees && nominees.length > 0 && (
              <section className="maintain-application-section">
                <h3>Nominees</h3>
                <div className="nominees-grid">
                  {nominees.map((nominee, index) => (
                    <div key={index} className="nominee-item">
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
                      </div>
                    </div>
                  ))}
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
                  {documents.map((doc, index) => (
                    <div key={index} className={`document-item ${doc.status === 'MISSING' ? 'document-missing' : ''}`}>
                      {doc.status === 'MISSING' ? (
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
                  ))}
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
            {applicationStatus === 'approved' && (
              <>
                <section className="maintain-application-section approved-section">
                  <h2>APPROVED AMOUNT</h2>
                  <div className="approved-card">
                    <div className="approved-item primary-item">
                      <span className="label">MONTHLY PAYOUT</span>
                      <span className="amount">RM {formatCurrency(approvedAmount)}</span>
                      <span className="date">Starting Dec 2025</span>
                    </div>
                    <div className="approved-item">
                      <span className="label">TOTAL APPROVED</span>
                      <span className="amount">RM {formatCurrency(approvedAmount * 12)}</span>
                    </div>
                    <div className="approved-item">
                      <span className="label">PROPERTY VALUE</span>
                      <span className="amount">RM {formatCurrency(formData.purchasePrice)}</span>
                    </div>
                  </div>
                </section>

                {/* Actions Section */}
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
                      onClick={onTerminateApplication}
                      className="btn-outline-danger"
                    >
                      ✕ Terminate Application
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* Need Help Section */}
            <section className="maintain-application-section need-help-section">
              <h3>Need Help?</h3>
              <p>If you have questions about your application, please contact our support team.</p>
              <a href="/contact-support" className="support-link">Contact Support →</a>
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
  </>
  )
}

// Helper function to get status color
function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'approved':
      return 'status-approved'
    case 'pending':
      return 'status-pending'
    case 'rejected':
      return 'status-rejected'
    case 'terminated':
      return 'status-terminated'
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
