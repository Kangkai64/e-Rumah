// AdminApplicationReviewView
// Presentational component for admin application review page
// Receives ALL data and handlers via props from AdminApplicationReviewController
// NO business logic, NO state management (except local UI state), NO model imports

import '../client_controller/admin/AdminApplicationReviewView.css'

function AdminApplicationReviewView({
  application,
  documents,
  loading,
  error,
  activeTab,
  approvalLoading,
  showRejectModal,
  rejectionReason,
  showFlagDocumentModal,
  flaggedDocumentName,
  flagDocumentReason,
  flaggingDocument,
  showPDFViewer,
  viewingDocumentUrl,
  viewingDocumentName,
  onTabChange,
  onApprove,
  onReject,
  onConfirmReject,
  onCancelReject,
  onRejectionReasonChange,
  onFlagDocument,
  onConfirmFlagDocument,
  onCancelFlagDocument,
  onFlagDocumentReasonChange,
  onBackToDashboard,
  onViewDocument,
  onClosePDFViewer,
  formatCurrency,
  formatDate,
  getStatusBadgeClass,
  getStatusDisplayText
}) {
  if (loading) {
    return (
      <div className="admin-review-view">
        <div className="review-loading">Loading application details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-review-view">
        <div className="review-error">
          <p>Error: {error}</p>
          <button onClick={onBackToDashboard}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="admin-review-view">
        <div className="review-error">
          <p>Application not found</p>
          <button onClick={onBackToDashboard}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-review-view">
      <div className="review-container">
        {/* Header */}
        <div className="review-header">
          <div className="header-left">
            <button className="back-button" onClick={onBackToDashboard}>
              ← Back to Dashboard
            </button>
            <h1>Application Review</h1>
          </div>
          <div className="header-right">
            <span className={`status-badge status-badge-large ${getStatusBadgeClass(application.status)}`}>
              {getStatusDisplayText(application.status)}
            </span>
          </div>
        </div>

        {/* Application Summary Card */}
        <div className="summary-card">
          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">Application ID</span>
              <span className="summary-value">{application.id.substring(0, 8)}...</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Submitted Date</span>
              <span className="summary-value">{formatDate(application.submitted_at)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Applicant Name</span>
              <span className="summary-value">{application.users?.full_name || 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Property Type</span>
              <span className="summary-value">{application.properties?.property_type || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="review-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => onTabChange('overview')}
          >
            Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => onTabChange('documents')}
          >
            Documents
          </button>
          <button
            className={`tab-button ${activeTab === 'nominees' ? 'active' : ''}`}
            onClick={() => onTabChange('nominees')}
          >
            Nominees
          </button>
        </div>

        {/* Tab Content */}
        <div className="review-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Applicant Information */}
              <div className="info-section">
                <h2>Application Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">
                      {application.application_data?.form_data?.nameAsPerNRIC || application.users?.full_name || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">IC Number</span>
                    <span className="info-value">
                      {application.application_data?.form_data?.nricNo || application.users?.ic_number || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">
                      {application.application_data?.form_data?.email || application.users?.email || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Phone</span>
                    <span className="info-value">
                      {application.application_data?.form_data?.telephone || application.users?.phone || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div className="info-section">
                <h2>Property Information</h2>
                <div className="info-grid">
                  <div className="info-item full-width">
                    <span className="info-label">Address</span>
                    <span className="info-value">
                      {application.application_data?.form_data?.propertyAddress || application.properties?.address || 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Market Value</span>
                    <span className="info-value">
                      {formatCurrency(application.application_data?.form_data?.indicativeMarketValue || application.properties?.indicative_market_value)}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tenure</span>
                    <span className="info-value">
                      {application.application_data?.form_data?.tenureTitle || application.properties?.tenure_title || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Remarks */}
              {application.remarks && (
                <div className="info-section">
                  <h2>Remarks</h2>
                  <p className="remarks-text">{application.remarks}</p>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="documents-tab">
              <div className="info-section">
                <h2>Application Documents</h2>
                
                {documents && documents.length > 0 ? (
                  <div className="documents-grid">
                    {documents.map((doc, index) => {
                      // Filter out Marriage Certificate if user is single
                      const maritalStatus = application?.submitted_form_data?.maritalStatus || application?.application_data?.form_data?.maritalStatus
                      if (doc.displayName === 'Marriage Certificate' && maritalStatus === 'Single') {
                        return null
                      }

                      return (
                        <div key={index} className="document-item">
                          <div className="document-icon">
                            {doc.status === 'FOUND' ? '📄' : '❌'}
                          </div>
                          <div className="document-info">
                            <span className="document-name">{doc.displayName}</span>
                            <span className="document-status">
                              {doc.status === 'FOUND' ? `${(doc.size / 1024).toFixed(2)} KB` : 'Not uploaded'}
                            </span>
                            {doc.status === 'FOUND' && doc.createdAt && (
                              <span className="document-date">
                                Uploaded: {formatDate(doc.createdAt)}
                              </span>
                            )}
                          </div>
                          {doc.status === 'FOUND' && doc.url && (
                            <div className="document-actions">
                              <button
                                className="view-document-btn"
                                onClick={() => onViewDocument(doc)}
                              >
                                View
                              </button>
                              <button
                                className="flag-document-btn"
                                onClick={() => onFlagDocument(doc)}
                                disabled={flaggingDocument}
                              >
                                Flag
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="no-documents">No documents available</p>
                )}
              </div>
            </div>
          )}

          {/* Nominees Tab */}
          {activeTab === 'nominees' && (
            <div className="nominees-tab">
              <div className="info-section">
                <h2>Nominees Information</h2>
                
                {application.nominees && application.nominees.length > 0 ? (
                  <div className="nominees-list">
                    {application.nominees.map((nominee, index) => (
                      <div key={nominee.id} className="nominee-card">
                        <h3>Nominee {index + 1}</h3>
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="info-label">Name</span>
                            <span className="info-value">{nominee.name || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">IC Number</span>
                            <span className="info-value">{nominee.ic_number || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Date of Birth</span>
                            <span className="info-value">
                              {nominee.dob_day && nominee.dob_month && nominee.dob_year 
                                ? `${nominee.dob_day}/${nominee.dob_month}/${nominee.dob_year}` 
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Sex</span>
                            <span className="info-value">{nominee.sex || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Race</span>
                            <span className="info-value">{nominee.race || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Malaysian</span>
                            <span className="info-value">{nominee.is_malaysian ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Marital Status</span>
                            <span className="info-value">{nominee.marital_status || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Relationship</span>
                            <span className="info-value">{nominee.relationship || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Email</span>
                            <span className="info-value">{nominee.email || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Residence Phone</span>
                            <span className="info-value">{nominee.residence_phone || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Mobile Phone</span>
                            <span className="info-value">{nominee.telephone || 'N/A'}</span>
                          </div>
                          <div className="info-item full-width">
                            <span className="info-label">Address</span>
                            <span className="info-value">{nominee.address || 'N/A'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Postcode</span>
                            <span className="info-value">{nominee.postcode || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-nominees">No nominees added to this application</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {application.status !== 'rejected' && (
          <div className="review-actions">
            <button
              className="reject-button"
              onClick={onReject}
              disabled={approvalLoading || application.status === 'approved'}
            >
              Reject Application
            </button>
            <button
              className="approve-button"
              onClick={onApprove}
              disabled={approvalLoading || application.status === 'approved'}
            >
              {approvalLoading ? 'Processing...' : application.status === 'approved' ? 'Already Approved' : 'Approve Application'}
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Reject Application</h2>
            <p>Please provide a reason for rejection:</p>
            <textarea
              className="rejection-textarea"
              value={rejectionReason}
              onChange={(e) => onRejectionReasonChange(e.target.value)}
              placeholder="Enter rejection reason..."
              rows="5"
            />
            <div className="modal-actions">
              <button className="cancel-button" onClick={onCancelReject}>
                Cancel
              </button>
              <button
                className="confirm-reject-button"
                onClick={onConfirmReject}
                disabled={!rejectionReason.trim() || approvalLoading}
              >
                {approvalLoading ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Document Modal */}
      {showFlagDocumentModal && flaggedDocumentName && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Flag Document: {flaggedDocumentName}</h2>
            <p>Please provide a reason for flagging this document. The document will be deleted and the user will be notified to re-upload a correct version.</p>
            <textarea
              className="rejection-textarea"
              value={flagDocumentReason}
              onChange={(e) => onFlagDocumentReasonChange(e.target.value)}
              placeholder="Enter reason for flagging (e.g., Document is unclear, wrong document type, etc.)..."
              rows="5"
            />
            <div className="modal-actions">
              <button className="cancel-button" onClick={onCancelFlagDocument}>
                Cancel
              </button>
              <button
                className="confirm-reject-button"
                onClick={onConfirmFlagDocument}
                disabled={!flagDocumentReason.trim() || flaggingDocument}
                style={{backgroundColor: '#dc2626'}}
              >
                {flaggingDocument ? 'Flagging...' : 'Flag & Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && viewingDocumentUrl && (
        <div className="modal-overlay pdf-viewer-overlay">
          <div className="modal-content pdf-viewer-modal">
            <div className="modal-header">
              <h3>{viewingDocumentName}</h3>
              <button className="close-button" onClick={onClosePDFViewer}>×</button>
            </div>
            <div className="pdf-viewer-body">
              <iframe
                src={viewingDocumentUrl}
                title={viewingDocumentName}
                style={{
                  width: '100%',
                  height: '70vh',
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
            </div>
            <div className="modal-footer">
              <button className="cancel-button" onClick={onClosePDFViewer}>
                Close
              </button>
              <button 
                className="approve-button"
                onClick={() => window.open(viewingDocumentUrl, '_blank')}
              >
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminApplicationReviewView
