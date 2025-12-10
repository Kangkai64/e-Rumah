// Maintain Application View - Pure Presentational Component
// Displays application details, status, timeline, and actions
// Receives all props from MaintainApplicationController
// NO business logic - only UI rendering
// NO imports from other views allowed!

import '../components/application/maintainApplication.css'
import Button from '../components/common/Button'
import Container from '../components/common/Container'

function MaintainApplicationView({
  isLoading,
  error,
  application,
  applicationStatus,
  approvedAmount,
  timeline,
  onEditApplication,
  onTerminateApplication
}) {
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

  return (
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
                  <span className="value">{formData.age || '-'}</span>
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
                    <span className="value">{formData.jAge || '-'}</span>
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
                  <span className="value">{formData.ownershipDuration || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Estimated Value</span>
                  <span className="value">RM {formatCurrency(formData.propertyValue) || '-'}</span>
                </div>
              </div>
            </section>

            {/* Nominees */}
            {formData.nominees && formData.nominees.length > 0 && (
              <section className="maintain-application-section">
                <h3>Nominees</h3>
                <div className="nominees-grid">
                  {formData.nominees.map((nominee, index) => (
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
                      <span className="amount">RM {formatCurrency(formData.propertyValue)}</span>
                    </div>
                  </div>
                </section>

                {/* Actions Section */}
                <section className="maintain-application-section actions-box-section">
                  <h3 className="actions-title">Actions</h3>
                  <div className="actions-section">
                    <button
                      onClick={onEditApplication}
                      className="btn-download-pdf"
                    >
                      ↓ Download PDF
                    </button>
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
