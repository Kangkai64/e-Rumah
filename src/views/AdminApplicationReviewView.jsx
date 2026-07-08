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
  approvedAmount,
  onApprovedAmountChange,
  showRejectModal,
  rejectionReason,
  showFlagDocumentModal,
  flaggedDocumentName,
  flagDocumentReason,
  flaggingDocument,
  showPDFViewer,
  viewingDocumentUrl,
  viewingDocumentName,
  loadingApplicationPDF,
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
  onViewApplicationPDF,
  onDownloadApplicationPDF,
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

  // form_data holds the applicant's submitted snapshot; properties/users are the DB fallback
  const fd = application.application_data?.form_data || {}
  const prop = application.properties || {}

  const gv = (value) => {
    if (value === true) return 'Yes'
    if (value === false) return 'No'
    if (value === '' || value === undefined || value === null) return 'N/A'
    return value
  }

  const formatDMY = (day, month, year, fallbackDate) => {
    if (day && month && year) return `${day}/${month}/${year}`
    if (fallbackDate) return formatDate(fallbackDate)
    return 'N/A'
  }

  const isJointApplicant = fd.isJointApplicant

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
                <h4 className="info-subheading">Basic Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Full Name</span>
                    <span className="info-value">{fd.nameAsPerNRIC || application.users?.full_name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">IC Number</span>
                    <span className="info-value">{fd.nricNo || application.users?.ic_number || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Sex</span>
                    <span className="info-value">{gv(fd.sex)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Race</span>
                    <span className="info-value">{gv(fd.race)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Malaysian Citizen</span>
                    <span className="info-value">{gv(fd.malaysian)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Marital Status</span>
                    <span className="info-value">{gv(fd.maritalStatus)}</span>
                  </div>
                </div>

                <h4 className="info-subheading">Contact Information</h4>
                <div className="info-grid">
                  <div className="info-item full-width">
                    <span className="info-label">Address</span>
                    <span className="info-value">{gv(fd.address)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Postcode</span>
                    <span className="info-value">{gv(fd.postcode)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{fd.email || application.users?.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Residence Phone</span>
                    <span className="info-value">{gv(fd.residencePhone)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mobile Phone</span>
                    <span className="info-value">{fd.telephone || application.users?.phone || 'N/A'}</span>
                  </div>
                </div>

                <h4 className="info-subheading">Family & Housing</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Number of Dependents</span>
                    <span className="info-value">{gv(fd.numOfDependents)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Present House Ownership</span>
                    <span className="info-value">{gv(fd.presentHouse)}</span>
                  </div>
                </div>

                <h4 className="info-subheading">Employment Details</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Occupation</span>
                    <span className="info-value">{gv(fd.occupation)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Employer Name</span>
                    <span className="info-value">{gv(fd.employerName)}</span>
                  </div>
                  <div className="info-item full-width">
                    <span className="info-label">Employer Address</span>
                    <span className="info-value">{gv(fd.employerAddress)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Employer Postcode</span>
                    <span className="info-value">{gv(fd.employerPostcode)}</span>
                  </div>
                </div>

                <h4 className="info-subheading">Application Preferences</h4>
                <div className="info-grid">
                  <div className="info-item full-width">
                    <span className="info-label">Purpose of Application</span>
                    <span className="info-value">{gv(fd.purposeOfApplication)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">How Did You Hear About SSB</span>
                    <span className="info-value">{gv(fd.howDidYouKnow)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Preferred Scheme</span>
                    <span className="info-value">{gv(fd.preferredScheme)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Payout Option</span>
                    <span className="info-value">{gv(fd.payoutOption)}</span>
                  </div>
                  {fd.payoutOption === 'monthlyPayout_lumpSum' && (
                    <div className="info-item">
                      <span className="info-label">Lump Sum Usage</span>
                      <span className="info-value">{gv(fd.lumpSumUsage)}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Payment Option</span>
                    <span className="info-value">{gv(fd.paymentOption)}</span>
                  </div>
                </div>
              </div>

              {/* Joint Applicant Information */}
              {isJointApplicant && (
                <div className="info-section">
                  <h2>Joint Applicant Information</h2>
                  <h4 className="info-subheading">Basic Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Full Name</span>
                      <span className="info-value">{gv(fd.jName)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">IC Number</span>
                      <span className="info-value">{gv(fd.jIc)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Sex</span>
                      <span className="info-value">{gv(fd.jSex)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Race</span>
                      <span className="info-value">{gv(fd.jRace)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Malaysian Citizen</span>
                      <span className="info-value">{gv(fd.jMalaysian)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Marital Status</span>
                      <span className="info-value">{gv(fd.jMarital)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Relationship to Applicant</span>
                      <span className="info-value">{gv(fd.jRelationship)}</span>
                    </div>
                  </div>

                  <h4 className="info-subheading">Contact Information</h4>
                  <div className="info-grid">
                    <div className="info-item full-width">
                      <span className="info-label">Address</span>
                      <span className="info-value">{gv(fd.jAddress)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Postcode</span>
                      <span className="info-value">{gv(fd.jPostcode)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email</span>
                      <span className="info-value">{gv(fd.jEmail)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Residence Phone</span>
                      <span className="info-value">{gv(fd.jResidencePhone)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Mobile Phone</span>
                      <span className="info-value">{gv(fd.jTelephone)}</span>
                    </div>
                  </div>

                  <h4 className="info-subheading">Employment Details</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Occupation</span>
                      <span className="info-value">{gv(fd.jOccupation)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Employer Name</span>
                      <span className="info-value">{gv(fd.jEmployerName)}</span>
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Employer Address</span>
                      <span className="info-value">{gv(fd.jEmployerAddress)}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Employer Postcode</span>
                      <span className="info-value">{gv(fd.jEmployerPostcode)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Banking Information */}
              <div className="info-section">
                <h2>Banking Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Bank Name</span>
                    <span className="info-value">{gv(fd.bankName === 'Other' ? fd.otherBankName : fd.bankName)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Account Type</span>
                    <span className="info-value">{gv(fd.accountType)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Account Number</span>
                    <span className="info-value">{gv(fd.accountNumber)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Account Preference</span>
                    <span className="info-value">{gv(fd.accountPreference)}</span>
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div className="info-section">
                <h2>Property Information</h2>
                <h4 className="info-subheading">Property Details</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Property Type</span>
                    <span className="info-value">{fd.propertyType || prop.property_type || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Tenure / Title</span>
                    <span className="info-value">{fd.tenureTitle || prop.tenure_title || 'N/A'}</span>
                  </div>
                  {(fd.tenureTitle === 'leasehold' || prop.tenure_title === 'leasehold') && (
                    <div className="info-item">
                      <span className="info-label">Lease Expiry Date</span>
                      <span className="info-value">{formatDMY(fd.expiryDay, fd.expiryMonth, fd.expiryYear, prop.expiry_date)}</span>
                    </div>
                  )}
                  <div className="info-item full-width">
                    <span className="info-label">Street Address</span>
                    <span className="info-value">{fd.propertyAddress || prop.address || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Scheme / Taman Name</span>
                    <span className="info-value">{fd.propertySchemeName || prop.scheme_name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">District</span>
                    <span className="info-value">{fd.propertyDistrict || prop.district || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Mukim</span>
                    <span className="info-value">{fd.propertyMukim || prop.mukim || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Postcode</span>
                    <span className="info-value">{fd.propertyPostcode || prop.postcode || 'N/A'}</span>
                  </div>
                </div>

                <h4 className="info-subheading">Property Measurements</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Land Area</span>
                    <span className="info-value">{fd.landArea || prop.land_area ? `${fd.landArea || prop.land_area} sqm` : 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Built-up Area</span>
                    <span className="info-value">{fd.buildUpArea || prop.build_up_area ? `${fd.buildUpArea || prop.build_up_area} sqm` : 'N/A'}</span>
                  </div>
                </div>

                <h4 className="info-subheading">Valuation & Purchase</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Indicative Market Value</span>
                    <span className="info-value">{formatCurrency(fd.indicativeMarketValue || prop.indicative_market_value)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Valuation Date</span>
                    <span className="info-value">{formatDMY(fd.valuationDay, fd.valuationMonth, fd.valuationYear, prop.valuation_date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Applicant Expected Market Value</span>
                    <span className="info-value">{formatCurrency(fd.expectedMarketValue || prop.expected_market_value)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Sale & Purchase Price</span>
                    <span className="info-value">{formatCurrency(fd.purchasePrice || prop.purchase_price)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Sale & Purchase Date</span>
                    <span className="info-value">{formatDMY(fd.purchaseDay, fd.purchaseMonth, fd.purchaseYear, prop.purchase_date)}</span>
                  </div>
                </div>

                <h4 className="info-subheading">Property Financing</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Property Encumbered</span>
                    <span className="info-value">{gv(fd.propertyEncumbered) !== 'N/A' ? gv(fd.propertyEncumbered) : gv(prop.is_encumbered)}</span>
                  </div>
                  {(fd.propertyEncumbered === 'yes' || prop.is_encumbered) && (
                    <>
                      <div className="info-item">
                        <span className="info-label">Bank / Financial Institution</span>
                        <span className="info-value">{fd.propertyBankName || prop.bank_name || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Est. Outstanding Balance</span>
                        <span className="info-value">{formatCurrency(fd.estOutstandingBalance || prop.est_outstanding_balance)}</span>
                      </div>
                    </>
                  )}
                </div>

                <h4 className="info-subheading">Fire Insurance</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Fire Insurance Status</span>
                    <span className="info-value">{gv(fd.fireInsurance) !== 'N/A' ? gv(fd.fireInsurance) : gv(prop.has_fire_insurance)}</span>
                  </div>
                  {(fd.fireInsurance === 'inForce' || prop.has_fire_insurance) && (
                    <>
                      <div className="info-item">
                        <span className="info-label">Insurance Company</span>
                        <span className="info-value">{fd.insuranceCompany || prop.insurance_company || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Period of Validity</span>
                        <span className="info-value">{fd.periodValidity || prop.insurance_period_validity || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  <div className="info-item">
                    <span className="info-label">Renewal Status</span>
                    <span className="info-value">{gv(fd.renewalFireInsurance)}</span>
                  </div>
                </div>
              </div>

              {/* Application Form PDF */}
              <div className="info-section">
                <h2>Application Form</h2>
                <div className="application-form-section">
                  <p className="form-description">
                    View or download the complete submitted application form in PDF format.
                  </p>
                  <div className="pdf-actions">
                    <button 
                      className="view-pdf-btn"
                      onClick={onViewApplicationPDF}
                      disabled={loadingApplicationPDF}
                    >
                      {loadingApplicationPDF ? '⏳ Loading...' : '📄 View Application Form'}
                    </button>
                    <button 
                      className="download-pdf-btn"
                      onClick={onDownloadApplicationPDF}
                      disabled={loadingApplicationPDF}
                    >
                      {loadingApplicationPDF ? '⏳ Loading...' : '⬇️ Download PDF'}
                    </button>
                  </div>
                  {application.submitted_at && (
                    <p className="submission-info">
                      Submitted on: {formatDate(application.submitted_at)}
                    </p>
                  )}
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

        {/* Approved Amount Section - For Under Review Status */}
        {application.status === 'underReviewed' && (
          <div className="approved-amount-section">
            <h3>Set Approved Amount</h3>
            <div className="approved-amount-input-group">
              <label htmlFor="approvedAmount">Approved Amount (RM)</label>
              <input
                id="approvedAmount"
                type="number"
                placeholder="Enter approved amount"
                value={approvedAmount}
                onChange={(e) => onApprovedAmountChange(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
          </div>
        )}

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
