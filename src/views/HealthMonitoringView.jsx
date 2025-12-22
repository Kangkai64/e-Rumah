// HealthReport View - Pure Presentational Component
// Receives all props from HealthReportController
// NO business logic - only UI rendering
// Now includes both User and Admin views with conditional rendering based on userRole

import React, { useRef, useState, useEffect, useCallback } from 'react'
import searchIcon from '../assets/icons/health_report_page/icon_search.svg'
import filterIcon from '../assets/icons/health_report_page/icon_filter.svg'
import uploadIcon from '../assets/icons/health_report_page/icon_upload_document.svg'
import sortIcon from '../assets/icons/health_report_page/icon_sort.svg'
import shareLinkIcon from '../assets/icons/health_report_page/icon_share_link.svg'
import calendarIcon from '../assets/icons/health_report_page/icon_calendar_body.svg'
import caregiverIcon from '../assets/icons/health_report_page/icon_caregiver.svg'
import familyIcon from '../assets/icons/health_report_page/icon_family.svg'
import healthcareProviderIcon from '../assets/icons/health_report_page/icon_healthcare_provider.svg'
import downloadIcon from '../assets/icons/health_report_page/icon_download.svg'
import ascIcon from '../assets/icons/health_report_page/icon_arrow_up.svg'
import descIcon from '../assets/icons/health_report_page/icon_arrow_down.svg'
import warningIcon from '../assets/icons/health_report_page/icon_warning.svg'
import { convertImagesToPDF, isImageFile, isPDFFile, validateHealthReportFile } from '../utils/pdfConverter'
import '../client_controller/health_report/HealthMonitoringView.css'

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

// Alert Component
function AlertMessage({ alerts }) {
  if (!alerts || alerts.length === 0) return null

  return (
    <div className="health-alerts">
      {alerts.map((alert, index) => (
        <div key={index} className={`alert alert-${alert.type}`}>
          <span className="alert-icon">
            {alert.type === 'error' ? '⚠' : 'i'}
          </span>
          <span className="alert-message">{alert.message}</span>
        </div>
      ))}
    </div>
  )
}

// Success Message Component
function SuccessMessage({ message }) {
  if (!message) return null

  return (
    <div className="success-message">
      <span className="success-icon">✓</span>
      <span>{message}</span>
    </div>
  )
}

// Success Overlay Component (Full screen overlay notification)
function SuccessOverlay({ show, message }) {
  if (!show) return null

  return (
    <div className="success-overlay">
      <div className="success-overlay-content">
        <div className="success-overlay-icon">✓</div>
        <p>{message}</p>
      </div>
    </div>
  )
}

// Error Message Component
function ErrorMessage({ error }) {
  if (!error) return null

  return (
    <div className="error-message">
      <span className="error-icon">✗</span>
      <span>{error}</span>
    </div>
  )
}

// Status Badge Component
function StatusBadge({ status }) {
  const getStatusClass = (status) => {
    const statusLower = (status || '').toLowerCase()
    if (statusLower.includes('flagged')) return 'status-flagged'
    if (statusLower.includes('pending')) return 'status-pending'
    if (statusLower.includes('reviewed') || statusLower.includes('approved')) return 'status-reviewed'
    if (statusLower.includes('rejected')) return 'status-rejected'
    if (statusLower.includes('archived')) return 'status-archived'
    return 'status-pending'
  }

  const statusClass = getStatusClass(status)
  const isFlagged = statusClass === 'status-flagged'

  return (
    <span className={`status-badge ${statusClass}`}>
      {isFlagged && <img src={warningIcon} alt="Warning" style={{ width: '12px', height: '12px', marginRight: '4px', display: 'inline-block' }} />}
      {status || 'Pending'}
    </span>
  )
}

// Drag and Drop Area Component
function DragDropArea({
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  file
}) {
  const fileInputRef = useRef(null)

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }

  return (
    <div
      className={`drag-drop-area ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="drag-drop-content">
        <div className="drag-drop-icon">
          <img src={uploadIcon} alt="Upload" style={{ width: '48px', height: '48px' }} />
        </div>
        <div className="drag-drop-text">
          {file ? (
            <>
              <div className="file-name">{file.name}</div>
              <div className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</div>
            </>
          ) : (
            <>
              <div>Drag and drop your health report here</div>
              <div className="drag-drop-subtext">or click to select</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Upload Modal Component
function UploadModal({
  show,
  uploadForm,
  isDragging,
  errors,
  onCancel,
  onUploadFormChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onSubmit,
  applicationId // Current applicationId from URL
}) {
  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Upload Health Report</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <p className="upload-subtitle">PDF, JPG up to 10MB</p>

          <DragDropArea
            isDragging={isDragging}
            onDragEnter={onDragEnter}
            onDragLeave={onDragLeave}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onFileSelect={onFileSelect}
            file={uploadForm.file}
          />

          {/* Show current application context if accessing from application page */}
          {applicationId && (
            <div className="form-group">
              <div className="info-box">
                <strong>Application Context:</strong> This health report will be associated with Application ID: {applicationId}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reportType">Report Type *</label>
            <select
              id="reportType"
              value={uploadForm.reportType}
              onChange={(e) => onUploadFormChange('reportType', e.target.value)}
              required
            >
              <option value="">Select report type</option>
              <option value="Medical Report">Medical Report</option>
              <option value="Lab Test">Lab Test</option>
              <option value="Prescription">Prescription</option>
              <option value="Vaccination Record">Vaccination Record</option>
              <option value="Doctor's Visit Summary">Doctor's Visit Summary</option>
            </select>
            {errors.reportType && <span className="error-text">{errors.reportType}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reportDate">Report Date *</label>
            <input
              type="date"
              id="reportDate"
              value={uploadForm.reportDate}
              onChange={(e) => onUploadFormChange('reportDate', e.target.value)}
              required
            />
            {errors.reportDate && <span className="error-text">{errors.reportDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reportTitle">Report Title *</label>
            <input
              type="text"
              id="reportTitle"
              placeholder="Enter a descriptive title for your report"
              value={uploadForm.reportTitle}
              onChange={(e) => onUploadFormChange('reportTitle', e.target.value)}
              required
            />
            {errors.reportTitle && <span className="error-text">{errors.reportTitle}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="providerName">Healthcare Provider *</label>
            <input
              type="text"
              id="providerName"
              placeholder="Name of the healthcare provider or facility"
              value={uploadForm.providerName}
              onChange={(e) => onUploadFormChange('providerName', e.target.value)}
              required
            />
            {errors.providerName && <span className="error-text">{errors.providerName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              placeholder="Additional notes about this report"
              value={uploadForm.notes}
              onChange={(e) => onUploadFormChange('notes', e.target.value)}
              rows="3"
            ></textarea>
            {errors.notes && <span className="error-text">{errors.notes}</span>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit}>Upload Report</button>
        </div>
      </div>
    </div>
  )
}

// Share Modal Component
function ShareModal({
  show,
  shareForm,
  errors,
  onCancel,
  onShareFormChange,
  onShareFormSubmit,
  errorMessage,
  successMessage,
  shareLinks = [],
  isShareLinksLoading = false,
  onCopyShareLink,
  onRevokeShareLink
}) {
  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share Health Report</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          {/* Status messages for share actions */}
          <ErrorMessage error={errorMessage} />
          <div className="form-group">
            <label>Select Sharing Option *</label>
            <div className="share-options">
              <button
                className={`share-option ${shareForm.shareOption === 'caregiver' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'caregiver')}
              >
                <img src={caregiverIcon} alt="Caregiver" className="option-icon" />
                <span>Share with Caregiver</span>
              </button>

              <button
                className={`share-option ${shareForm.shareOption === 'family' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'family')}
              >
                <img src={familyIcon} alt="Family" className="option-icon" />
                <span>Share with Family Member</span>
              </button>

              <button
                className={`share-option ${shareForm.shareOption === 'healthcare' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'healthcare')}
              >
                <img src={healthcareProviderIcon} alt="Healthcare Provider" className="option-icon" />
                <span>Share with Healthcare Provider</span>
              </button>

              <button
                className={`share-option ${shareForm.shareOption === 'link' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'link')}
              >
                <img src={shareLinkIcon} alt="Share Link" className="option-icon" />
                <span>Copy Share Link</span>
              </button>

              <button
                className={`share-option ${shareForm.shareOption === 'email' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'email')}
              >
                <span className="option-icon">✉</span>
                <span>Share via Email</span>
              </button>

              <button
                className={`share-option ${shareForm.shareOption === 'download' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'download')}
              >
                <img src={downloadIcon} alt="Download" className="option-icon" />
                <span>Download as PDF</span>
              </button>
            </div>
          </div>

          {(shareForm.shareOption === 'caregiver' || shareForm.shareOption === 'family' || shareForm.shareOption === 'healthcare' || shareForm.shareOption === 'email') && (
            <>
              <div className="form-group">
                <label htmlFor="shareEmail">Email Address *</label>
                <input
                  type="email"
                  id="shareEmail"
                  value={shareForm.email}
                  onChange={(e) => onShareFormChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
                {errors.shareEmail && <span className="error-text">{errors.shareEmail}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="expiryDays">Link Expires In (Days)</label>
                <select
                  id="expiryDays"
                  value={shareForm.expiryDays}
                  onChange={(e) => onShareFormChange('expiryDays', parseInt(e.target.value))}
                >
                  <option value={1}>1 Day</option>
                  <option value={7}>7 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>
            </>
          )}

          {shareForm.shareOption === 'link' && (
            <div className="form-group">
              <label htmlFor="expiryDays">Link Expires In (Days)</label>
              <select
                id="expiryDays"
                value={shareForm.expiryDays}
                onChange={(e) => onShareFormChange('expiryDays', parseInt(e.target.value))}
              >
                <option value={1}>1 Day</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Manage Shared Links</label>
            {(isShareLinksLoading) ? (
              <div className="info-box">Loading shared links...</div>
            ) : (
              <>
                {(!shareLinks || shareLinks.length === 0) ? (
                  <div className="info-box">No shared links created for this report yet.</div>
                ) : (
                  <div className="shared-links-list">
                    {shareLinks.map((share) => {
                      const expiresAt = share.expires_at ? new Date(share.expires_at) : null
                      const expired = expiresAt ? expiresAt < new Date() : false
                      const statusLabel = share.is_revoked ? 'Revoked' : expired ? 'Expired' : 'Active'
                      const shareTypeLabel = (share.shared_with_type || 'link').replace(/_/g, ' ')

                      return (
                        <div
                          key={share.id}
                          className="shared-link-row"
                          style={{
                            border: '1px solid #e5e5e5',
                            borderRadius: '8px',
                            padding: '12px',
                            marginBottom: '10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '12px'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{shareTypeLabel}</div>
                            <div className="share-meta-line">Target: {share.shared_with_email || (share.shared_with_type === 'link' ? 'Shareable link' : 'Direct share')}</div>
                            <div className="share-meta-line">Status: {statusLabel}</div>
                            <div className="share-meta-line">Expires: {expiresAt ? expiresAt.toLocaleString('en-GB') : 'No expiry set'}</div>
                            <div className="share-meta-line">Accessed: {share.access_count || 0} times</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                              className="btn btn-secondary"
                              onClick={() => onCopyShareLink?.(share.shareUrl)}
                              disabled={!share.shareUrl || share.is_revoked}
                            >
                              Copy link
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => onRevokeShareLink?.(share.id)}
                              disabled={share.is_revoked}
                            >
                              Revoke access
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onShareFormSubmit}>Share</button>
        </div>
      </div>
    </div>
  )
}

// Reminder Modal Component
function ReminderModal({
  show,
  reminderForm,
  editingReminder,
  errors,
  onCancel,
  onFormChange,
  onSubmit,
  successMessage,
  showSuccessOverlay
}) {
  if (!show) return null

  const isNew = !editingReminder

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content reminder-modal" onClick={(e) => e.stopPropagation()}>
        {/* Success message inside modal */}
        {showSuccessOverlay && successMessage && (
          <div className="modal-success-banner">
            <div className="success-icon">✓</div>
            <span>{successMessage}</span>
          </div>
        )}

        <div className="modal-header">
          <h3>{editingReminder ? 'Edit Reminder' : 'Create New Reminder'}</h3>
          <button className="close-button" onClick={onCancel}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="reminderTitle">Reminder Title *</label>
            <input
              type="text"
              id="reminderTitle"
              value={reminderForm?.reminder_title || ''}
              onChange={(e) => onFormChange?.('reminder_title', e.target.value)}
              placeholder="Enter reminder title"
            />
            {errors?.reminder_title && <span className="error-text">{errors.reminder_title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reminderType">Reminder Type *</label>
            <select
              id="reminderType"
              value={reminderForm?.reminder_type || 'Next health check'}
              onChange={(e) => onFormChange?.('reminder_type', e.target.value)}
            >
              <option value="Next health check">Next health check</option>
              <option value="Medication refill">Medication refill</option>
              <option value="Blood pressure check">Blood pressure check</option>
              <option value="Doctor visit">Doctor visit</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Lab test">Lab test</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reminderDate">Date *</label>
            <input
              type="date"
              id="reminderDate"
              value={reminderForm?.reminder_date || ''}
              onChange={(e) => onFormChange?.('reminder_date', e.target.value)}
            />
            {errors?.reminder_date && <span className="error-text">{errors.reminder_date}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="reminderTime">Time *</label>
            <input
              type="time"
              id="reminderTime"
              value={reminderForm?.reminder_time || ''}
              onChange={(e) => onFormChange?.('reminder_time', e.target.value)}
            />
            {errors?.reminder_time && <span className="error-text">{errors.reminder_time}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={reminderForm?.category || 'Health & appointments'}
              onChange={(e) => onFormChange?.('category', e.target.value)}
            >
              <option value="Health & appointments">Health & appointments</option>
              <option value="Medication">Medication</option>
              <option value="Personal">Personal</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              value={reminderForm?.notes || ''}
              onChange={(e) => onFormChange?.('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Reminder Frequency (Default: 1 week and 1 day before)</label>
            <div className="frequency-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reminderForm?.reminder_frequencies?.enabled_1_week ?? (isNew ? true : false)}
                  onChange={(e) => onFormChange?.('reminder_frequencies', {
                    ...reminderForm?.reminder_frequencies,
                    enabled_1_week: e.target.checked
                  })}
                />
                <span className="checkmark"></span>
                1 week before
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reminderForm?.reminder_frequencies?.enabled_3_days ?? (isNew ? true : false)}
                  onChange={(e) => onFormChange?.('reminder_frequencies', {
                    ...reminderForm?.reminder_frequencies,
                    enabled_3_days: e.target.checked
                  })}
                />
                <span className="checkmark"></span>
                3 days before
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={reminderForm?.reminder_frequencies?.enabled_1_day ?? (isNew ? true : false)}
                  onChange={(e) => onFormChange?.('reminder_frequencies', {
                    ...reminderForm?.reminder_frequencies,
                    enabled_1_day: e.target.checked
                  })}
                />
                <span className="checkmark"></span>
                1 day before
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={reminderForm?.is_enabled ?? (isNew ? true : false)}
                onChange={(e) => onFormChange?.('is_enabled', e.target.checked)}
              />
              <span className="checkmark"></span>
              Enable this reminder
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onSubmit}>
            {editingReminder ? 'Update Reminder' : 'Create Reminder'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// USER VIEW COMPONENT
// ============================================================================

function UserHealthReportView({
  // State
  alerts,
  successMessage,
  showSuccessOverlay,
  errorMessage,
  reports,
  uploadForm,
  shareForm,
  shareLinks,
  isShareLinksLoading,
  multiUploadForm,
  searchKey,
  filters,
  sortBy,
  sortOrder,
  showUploadModal,
  showShareModal,
  showPDFViewer,
  viewingReportUrl,
  viewingReport,
  showFilters,
  showSort,
  isDragging,
  errors,
  activeTab = 'archived',
  statistics,
  user, // Add user prop for accessing current user info
  applicationId, // Add applicationId prop

  // Reminder props
  reminders,
  upcomingReminders,
  overdueReminders,
  reminderStats,
  showReminderModal,
  reminderForm,
  editingReminder,
  selectedReminderCategory,
  showArchivedModal,
  showReuploadConfirm,
  reuploadFileData,

  // Handlers
  onUploadClick,
  onCancelUploadModal,
  onClosePDFViewer,
  onUploadFormChange,
  onMultiUploadFormChange,
  onMultipleFileUpload,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onUploadSubmit,
  onCancelShareModal,
  onShareFormChange,
  onShareFormSubmit,
  onCopyShareLink,
  onRevokeShareLink,
  onSearchChange,
  onSearch,
  onClearSearch,
  onFilterChange,
  onClearFilters,
  onTabFilter,
  onFilter,
  onSetShowFilters,
  onSetShowSort,
  onSort,
  onDownload,
  onShareClick,
  onDelete,
  onTabChange,
  onViewReport,
  onCreateReminder,
  onEditReminder,
  onDeleteReminder,
  onToggleReminder,
  onReminderFormChange,
  onSubmitReminder,
  onCancelReminderModal,
  onReminderCategoryFilter,
  onViewAllArchived,
  onCloseArchivedModal,
  onReuploadReport,
  onReuploadConfirm,
  onReuploadCancel
}) {
  // Add default values to prevent undefined errors
  const defaultStatistics = {
    reminderThisWeek: 0,
    overdueHealthReport: 0,
    healthReportDueSoon: 0,
    flaggedHealthReport: 0
  };

  const safeStatistics = {
    ...defaultStatistics,
    ...(statistics && typeof statistics === 'object' ? statistics : defaultStatistics)
  };

  // Safe event handlers with default functions
  const safeOnDragEnter = onDragEnter || ((e) => e.preventDefault());
  const safeOnDragLeave = onDragLeave || ((e) => e.preventDefault());
  const safeOnDragOver = onDragOver || ((e) => e.preventDefault());
  const safeOnDrop = onDrop || ((e) => e.preventDefault());
  const safeOnFileSelect = onFileSelect || (() => { });
  const safeOnUploadSubmit = onUploadSubmit || (() => { });
  const safeOnSearchChange = onSearchChange || ((value) => { console.log('Search change:', value); });
  const safeOnSearch = onSearch || (() => { console.log('Search triggered'); });
  const safeOnClearSearch = onClearSearch || (() => {
    console.log('Clear search triggered');
    if (safeOnSearchChange) safeOnSearchChange('');
    if (safeOnSearch) safeOnSearch();
  });
  const safeOnSetShowFilters = onSetShowFilters || (() => { });
  const safeOnSetShowSort = onSetShowSort || (() => { });
  const safeOnFilterChange = onFilterChange || (() => { });
  const safeOnClearFilters = onClearFilters || (() => { });
  const safeOnSort = onSort || (() => { });
  const safeOnDownload = onDownload || (() => { });
  const safeOnShareClick = onShareClick || (() => { });

  // Local state for managing selected files (declare before effects)
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState({ fileNames: '', fileCount: 0 });
  const [showDatePicker, setShowDatePicker] = useState({ start: false, end: false });
  const [selectedDates, setSelectedDates] = useState({ startDate: '', endDate: '' });

  // Disable background scrolling when any overlay/modal is open
  useEffect(() => {
    const hasOpenOverlay = Boolean(
      showUploadModal ||
      showShareModal ||
      showReminderModal ||
      showPDFViewer ||
      showSuccessOverlay ||
      showSuccessModal
    );

    if (hasOpenOverlay) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showUploadModal, showShareModal, showReminderModal, showPDFViewer, showSuccessOverlay, showSuccessModal]);

  // (moved state declarations above to avoid TDZ in effects)

  // File input ref for programmatic file selection
  const fileInputRef = useRef(null);

  // Enhanced drag handlers for full-page detection
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only activate on first enter with files
    if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only deactivate when leaving the entire window
    // Check if the relatedTarget is null (leaving window) or not a child element
    if (!e.relatedTarget || (!document.body.contains(e.relatedTarget))) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Ensure dataTransfer effect is set to allow drop
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFilesSelected(files);
    }
  };

  // Helper functions for date picker
  const getUserJoinDate = () => {
    // Default to 10 years ago if no user join date is available
    if (user && user.created_at) {
      const joinDate = new Date(user.created_at);
      joinDate.setFullYear(joinDate.getFullYear() - 10);
      return joinDate.toISOString().split('T')[0];
    }
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    return tenYearsAgo.toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  const handleCalendarClick = (type) => {
    setShowDatePicker(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleDateSelect = (type, value) => {
    const dateField = type === 'start' ? 'startDate' : 'endDate';
    const newDates = { ...selectedDates, [dateField]: value };
    setSelectedDates(newDates);

    // Update filters using the filter change handler
    if (onFilterChange) {
      onFilterChange(dateField, value);
    }

    // Only close the date picker if a complete date is selected
    // Check if the value is a complete date (YYYY-MM-DD format)
    if (value && value.length === 10 && value.includes('-')) {
      setShowDatePicker(prev => ({ ...prev, [type]: false }));
    }
  };

  // Close date picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking on the input field, calendar icon, or dropdown
      if (!event.target.closest('.date-input-wrapper') &&
        !event.target.closest('.date-picker-dropdown') &&
        !event.target.matches('input[type="date"]')) {
        setShowDatePicker({ start: false, end: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Add window-level event listeners for better drag detection
  React.useEffect(() => {
    const handleWindowDragEnter = (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
        setIsDragActive(true);
      }
    };

    const handleWindowDragLeave = (e) => {
      e.preventDefault();
      // Only hide overlay if mouse leaves the entire window
      if (e.clientX === 0 || e.clientY === 0 || e.clientX === window.innerWidth || e.clientY === window.innerHeight) {
        setIsDragActive(false);
      }
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      setIsDragActive(false);
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    window.addEventListener('dragover', (e) => e.preventDefault());

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
      window.removeEventListener('dragover', (e) => e.preventDefault());
    };
  }, []);

  // File selection handler with PDF conversion logic
  const handleFilesSelected = async (files) => {
    const processedFiles = [];
    const imageFiles = [];

    console.log('📁 Processing', files.length, 'selected files...');

    // Separate files into PDFs and images with enhanced validation
    for (const file of files) {
      try {
        console.log('🔍 Validating file:', file.name);
        const validation = await validateHealthReportFile(file);

        if (!validation.valid) {
          alert(`❌ Invalid file "${file.name}": ${validation.error}`);
          continue;
        }

        if (validation.willCompress) {
          console.log('📦 File will be compressed:', file.name);
        }

        if (isPDFFile(file)) {
          processedFiles.push(file);
          console.log('✅ PDF file validated:', file.name);
        } else if (isImageFile(file)) {
          imageFiles.push(file);
          console.log('🖼️ Image file will be converted:', file.name);
        }
      } catch (error) {
        console.error('❌ File validation error:', error);
        alert(`Error validating file "${file.name}": ${error.message}`);
      }
    }

    // If there are image files, ask user if they want to convert to PDF
    if (imageFiles.length > 0) {
      const convertToPDF = window.confirm(
        `You've selected ${imageFiles.length} image file(s). Health reports must be in PDF format. ` +
        `Would you like the system to convert these images into a PDF document?`
      );

      if (convertToPDF) {
        try {
          setIsConverting(true);
          const fileName = `health_report_${Date.now()}.pdf`;
          const convertedPDF = await convertImagesToPDF(imageFiles, fileName);
          processedFiles.push(convertedPDF);

          alert(
            `Successfully converted ${imageFiles.length} image(s) to PDF: ${fileName}`
          );
        } catch (error) {
          console.error('PDF conversion failed:', error);
          alert('Failed to convert images to PDF. Please try again or upload a PDF file directly.');
          return;
        } finally {
          setIsConverting(false);
        }
      } else {
        alert('Please upload PDF files only for health reports.');
        return;
      }
    }

    if (processedFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...processedFiles]);
      // Call the original handler with the first file for backwards compatibility
      if (safeOnFileSelect) {
        safeOnFileSelect(processedFiles[0]);
      }
    }
  };

  const onFileInputChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await handleFilesSelected(files);
    }
  };

  // Enhanced file select handler that triggers file input
  const handleFileSelect = () => {
    if (fileInputRef.current && !isConverting) {
      fileInputRef.current.click();
    }
  };

  // Remove file from selection
  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Submit function that calls controller method
  const handleSubmit = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to upload.');
      return;
    }

    if (!user || !user.id) {
      alert('User not authenticated. Please log in and try again.');
      return;
    }

    try {
      // Call controller method to handle business logic
      const result = await onMultipleFileUpload?.(selectedFiles);

      if (result?.success) {
        // Show success message and clear files
        const fileNames = selectedFiles.map(f => f.name).join(', ');
        setSuccessModalData({
          fileNames,
          fileCount: selectedFiles.length
        });
        setShowSuccessModal(true);

        // Auto-hide modal after 4 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
        }, 4000);

        // Clear selected files and reset form
        setSelectedFiles([]);

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        // Show error in UI
        setSuccessModalData({
          error: true,
          message: result?.error || 'Upload failed. Please try again.'
        });
        setShowSuccessModal(true);

        setTimeout(() => {
          setShowSuccessModal(false);
        }, 4000);
      }
    } catch (error) {
      console.error('Upload process failed:', error);
      setSuccessModalData({
        error: true,
        message: `Upload failed: ${error.message || 'An unexpected error occurred. Please try again.'}`
      });
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
      }, 4000);
    }
  };

  // Archived reports - filter to show only archived status
  const archivedReports = activeTab === 'archived'
    ? (reports && reports.filter(r => r.health_report_status === 'Archived')) || []
    : [];

  return (
    <div className={`health-report-container ${isDragActive ? 'drag-active' : ''}`}>
      {/* Success Overlay */}
      <SuccessOverlay show={showSuccessOverlay} message={successMessage} />

      {/* Full Page Drop Overlay */}
      {isDragActive && (
        <div
          className="full-page-drop-overlay"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="full-page-drop-content">
            <div className="full-page-drop-icon">📁</div>
            <h2>Drop your files here</h2>
            <p>Release to upload your health reports</p>
          </div>
        </div>
      )}

      <div className="health-report-content">
        {/* Success Modal */}
        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button
                className="modal-close"
                onClick={() => setShowSuccessModal(false)}
                aria-label="Close"
              >
                ✕
              </button>
              <div className="modal-checkmark">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="11" fill={successModalData.error ? "#ef4444" : "#22c55e"} stroke="none" />
                  {successModalData.error ? (
                    <path d="M8 8L16 16M8 16L16 8" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  ) : (
                    <path d="M7 12.5L10.5 16L17 8" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </svg>
              </div>
              <h2 className="modal-title" style={{ color: successModalData.error ? '#ef4444' : '#22c55e' }}>
                {successModalData.error ? 'Upload Failed' : 'Upload Successful!'}
              </h2>
              <p className="modal-message">
                {successModalData.error ? successModalData.message : `Successfully uploaded ${successModalData.fileCount} health report${successModalData.fileCount > 1 ? 's' : ''}!`}
              </p>
              {!successModalData.error && successModalData.fileNames && (
                <div className="modal-file-list">
                  <strong>Files uploaded:</strong><br />
                  {successModalData.fileNames}
                </div>
              )}
              {!successModalData.error && (
                <p className="modal-message" style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                  Your reports are now under review and will appear in your health records.
                </p>
              )}
            </div>
          </div>
        )}
        {/* Alerts and Messages */}
        {alerts && alerts.length > 0 && <AlertMessage alerts={alerts} />}
        {successMessage && <SuccessMessage message={successMessage} />}
        {errorMessage && <ErrorMessage error={errorMessage} />}

        {/* Statistics Cards Section */}
        <div className="statistics-section">
          <div className="statistics-cards">
            <div className="stat-card">
              <div className="stat-label">Reminder this week</div>
              <div className="stat-value">{safeStatistics.reminderThisWeek || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Overdue Health Report</div>
              <div className="stat-value">{safeStatistics.overdueHealthReport || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Health Report Due Soon</div>
              <div className="stat-value">{safeStatistics.healthReportDueSoon || 0}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Flagged Health Report</div>
              <div className="stat-value">{safeStatistics.flaggedHealthReport || 0}</div>
            </div>
          </div>
        </div>

        {/* Upload Health Report Section - Compact */}
        <div className="upload-section-compact">
          <div className="upload-card">
            <h3>Upload Health Report</h3>
            <p className="upload-subtitle">PDF, JPG up to 10MB</p>

            {/* Form fields for report type and date */}
            <div className="upload-form-fields" style={{ marginBottom: '1.5rem' }}>
              <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group" style={{ flex: 1.5 }}>
                  <label htmlFor="reportType" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Report Type *</label>
                  <select
                    id="reportType"
                    value={multiUploadForm?.reportType || ''}
                    onChange={(e) => onMultiUploadFormChange?.('reportType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                    required
                  >
                    <option value="">Select report type</option>
                    <option value="Medical Report">Medical Report</option>
                    <option value="Lab Test">Lab Test</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Vaccination Record">Vaccination Record</option>
                    <option value="Doctor's Visit Summary">Doctor's Visit Summary</option>
                    <option value="Medical Image">Medical Image</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1.5 }}>
                  <label htmlFor="reportDate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Report Date *</label>
                  <input
                    type="date"
                    id="reportDate"
                    value={multiUploadForm?.reportDate || ''}
                    onChange={(e) => onMultiUploadFormChange?.('reportDate', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Custom report type field for "Others" */}
              {multiUploadForm?.reportType === 'Others' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="customReportType" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Custom Report Type *</label>
                  <input
                    type="text"
                    id="customReportType"
                    placeholder="Please specify the report type"
                    value={multiUploadForm?.customReportType || ''}
                    onChange={(e) => onMultiUploadFormChange?.('customReportType', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontFamily: 'Poppins, sans-serif'
                    }}
                    required
                  />
                </div>
              )}

              {/* Report Title field */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="reportTitle" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Report Title *</label>
                <input
                  type="text"
                  id="reportTitle"
                  placeholder="Enter a descriptive title for your reports"
                  value={multiUploadForm?.reportTitle || ''}
                  onChange={(e) => onMultiUploadFormChange?.('reportTitle', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                  required
                />
              </div>

              {/* Provider Name field */}
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label htmlFor="providerName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', fontSize: '0.9rem' }}>Healthcare Provider *</label>
                <input
                  type="text"
                  id="providerName"
                  placeholder="Name of the healthcare provider or facility"
                  value={multiUploadForm?.providerName || ''}
                  onChange={(e) => onMultiUploadFormChange?.('providerName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontFamily: 'Poppins, sans-serif'
                  }}
                  required
                />
              </div>

              {/* Show current application context if accessing from application page */}
              {applicationId && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#e8f4fd',
                    border: '1px solid #bee5eb',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}>
                    <strong>Application Context:</strong> These health reports will be associated with Application ID: {applicationId}
                  </div>
                </div>
              )}
            </div>

            <div
              className={`upload-drop-area ${isDragActive ? 'dragging' : ''} ${selectedFiles.length > 0 ? 'has-files' : ''} ${isConverting ? 'converting' : ''}`}
              onClick={isConverting ? undefined : handleFileSelect}
            >
              {isConverting ? (
                <>
                  <div className="spinner" style={{ margin: '0 auto 1rem auto' }}></div>
                  <p>Converting images to PDF...</p>
                  <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                    Please wait while we process your files
                  </p>
                </>
              ) : (
                <>
                  <img src={uploadIcon} alt="Upload" className="upload-icon" />
                  <p>Drag and drop files here or click to browse</p>
                  <p style={{ fontSize: '0.875rem', color: '#666', margin: '0.5rem 0 0 0' }}>
                    <strong>PDF files only</strong> - Images will be converted to PDF automatically
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#888', margin: '0.25rem 0 0 0' }}>
                    Maximum 10MB per file (Multiple files supported)
                  </p>
                </>
              )}
            </div>

            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              multiple
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={onFileInputChange}
            />

            {/* File Preview Section */}
            {selectedFiles.length > 0 && (
              <div className="file-preview-section">
                <h4 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                  Selected Files ({selectedFiles.length})
                </h4>
                <div className="file-preview-list">
                  {selectedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className="file-preview-item">
                      <div className="file-icon">
                        📄
                      </div>
                      <div className="file-info">
                        <div className="file-name" title={file.name}>{file.name}</div>
                        <div className="file-size">{formatFileSize(file.size)}</div>
                      </div>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeFile(index)}
                        title="Remove file"
                        disabled={isConverting}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn btn-primary btn-submit"
              onClick={handleSubmit}
              disabled={selectedFiles.length === 0 || isConverting}
              style={{
                opacity: selectedFiles.length === 0 || isConverting ? 0.6 : 1,
                cursor: selectedFiles.length === 0 || isConverting ? 'not-allowed' : 'pointer'
              }}
            >
              {isConverting ? 'Converting...' : `Submit (${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''})`}
            </button>
          </div>
        </div>

        {/* Health Monitoring Section */}
        <div className="health-monitoring-section">
          <div className="reminders-card">
            <div className="reminders-header">
              <h3>Reminders</h3>
              <span className="tab-indicator">Health & appointments</span>
              <button
                className="btn-add-reminder"
                onClick={() => onCreateReminder?.()}
                style={{
                  marginLeft: 'auto',
                  padding: '0.5rem 1rem',
                  background: '#A8202D',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                + Add Reminder
              </button>
            </div>

            {upcomingReminders && upcomingReminders.length > 0 ? (
              upcomingReminders.slice(0, 2).map((reminder) => (
                <div key={reminder.id} className="reminder-item">
                  <div className="reminder-content">
                    <div className="reminder-title">{reminder.reminder_title || reminder.reminder_type}</div>
                    <div className="reminder-description">
                      {new Date(reminder.reminder_date).toLocaleDateString('en-GB')} at{' '}
                      {new Date(reminder.reminder_date).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {(() => {
                        const now = new Date();
                        const reminderDate = new Date(reminder.reminder_date);
                        const diffMs = reminderDate.getTime() - now.getTime();
                        if (diffMs <= 0) return ' (due)';
                        const totalMinutes = Math.floor(diffMs / (1000 * 60));
                        const days = Math.floor(totalMinutes / (60 * 24));
                        const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
                        const minutes = totalMinutes % 60;
                        if (days > 0) {
                          return ` (${days}d ${hours}h ${minutes}m left)`;
                        }
                        if (hours > 0) {
                          return ` (${hours}h ${minutes}m left)`;
                        }
                        return ` (${minutes}m left)`;
                      })()}
                    </div>
                  </div>
                  <div className="reminder-toggle">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={reminder.is_enabled || false}
                        onChange={(e) => onToggleReminder?.(reminder.id, e.target.checked)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <button
                    className="btn-edit"
                    onClick={() => onEditReminder?.(reminder)}
                    style={{
                      marginLeft: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      background: 'transparent',
                      border: '1px solid #ddd',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                  >
                    Edit
                  </button>
                </div>
              ))
            ) : (
              <div className="reminder-item">
                <div className="reminder-content">
                  <div className="reminder-title">No upcoming reminders</div>
                  <div className="reminder-description">Click "Add Reminder" to set up health reminders</div>
                </div>
                <button
                  className="btn-add-first"
                  onClick={() => onCreateReminder?.()}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#f8f9fa',
                    border: '1px solid #A8202D',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: '#A8202D'
                  }}
                >
                  Add Reminder
                </button>
              </div>
            )}

            <div className="reminder-tags">
              <button
                className={`reminder-tag ${selectedReminderCategory === 'Health & appointments' ? 'active' : ''}`}
                onClick={() => onReminderCategoryFilter?.('Health & appointments')}
              >
                Health & appointments
              </button>
              <button
                className={`reminder-tag ${selectedReminderCategory === 'Medication' ? 'active' : ''}`}
                onClick={() => onReminderCategoryFilter?.('Medication')}
              >
                Medication
              </button>
              <button
                className={`reminder-tag ${selectedReminderCategory === 'Personal' ? 'active' : ''}`}
                onClick={() => onReminderCategoryFilter?.('Personal')}
              >
                Personal
              </button>
              <button
                className={`reminder-tag ${selectedReminderCategory === 'Other' ? 'active' : ''}`}
                onClick={() => onReminderCategoryFilter?.('Other')}
              >
                Other
              </button>
              <button
                className={`reminder-tag ${selectedReminderCategory === 'all' || !selectedReminderCategory ? 'active' : ''}`}
                onClick={() => onReminderCategoryFilter?.('all')}
              >
                All
              </button>
            </div>
          </div>

          <div className="archived-reports-card">
            <div className="archived-header">
              <h3>Archived Health Reports</h3>
              <button
                className="btn-view-all"
                onClick={() => onViewAllArchived?.()}
              >
                View all
              </button>
            </div>

            <div className="archived-table">
              <div className="table-header">
                <div className="table-col">Report Title</div>
                <div className="table-col">Date</div>
                <div className="table-col">Actions</div>
              </div>

              {archivedReports.length > 0 ? archivedReports.slice(0, 3).map((report) => (
                <div key={report.id} className="table-row">
                  <div className="table-col">{report.report_title || report.report_type || 'Medical Report'}</div>
                  <div className="table-col">{new Date(report.report_date).toLocaleDateString('en-GB')}</div>
                  <div className="table-col table-actions">
                    <button
                      className="btn-secondary btn-action"
                      onClick={() => onDownload?.(report.id)}
                    >
                      View
                    </button>
                    <button
                      className="btn-primary btn-action"
                      onClick={() => onShareClick?.(report)}
                    >
                      Share
                    </button>
                  </div>
                </div>
              )) : (
                <div className="table-row" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
                  <div className="table-col" style={{ textAlign: 'center', padding: '20px', color: '#666', width: 'fit-content' }}>No reports available</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Health Report Section */}
        <div className="search-section">
          <div className="search-header">
            <h2>Health report search</h2>
            <button
              className="btn-clear-filters"
              onClick={onClearFilters}
            >
              Clear all filters
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-input-group">
              <div className="search-input">
                <img src={searchIcon} alt="Search" className="search-icon" style={{ filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)', marginLeft: '12px' }} />
                <input
                  type="text"
                  placeholder="Search health reports, providers, titles"
                  value={searchKey || ''}
                  onChange={(e) => {
                    e.preventDefault();
                    safeOnSearchChange(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      safeOnSearch();
                    }
                  }}
                  onBlur={() => {
                    // Trigger search when user leaves the input field
                    safeOnSearch();
                  }}
                />
                <button
                  className="clear-search"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    safeOnClearSearch();
                  }}
                  type="button"
                  aria-label="Clear search"
                  style={{
                    display: searchKey && searchKey.length > 0 ? 'block' : 'none'
                  }}
                >
                  ×
                </button>
              </div>

              <button
                className="btn-filter"
                onClick={() => {
                  if (showSort) {
                    safeOnSetShowSort(false)
                  }
                  safeOnSetShowFilters(!showFilters)
                }}
              >
                <img src={filterIcon} alt="Filter" style={{ filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)' }} />
                {showFilters ? 'Hide' : 'Show'} Filter
              </button>

              <button
                className="btn-sort"
                onClick={() => {
                  if (showFilters) {
                    safeOnSetShowFilters(false)
                  }
                  safeOnSetShowSort(!showSort)
                }}
              >
                <img src={sortIcon} alt="Sort" style={{ filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)' }} />
                {showSort ? 'Hide' : 'Show'} Sort
              </button>
            </div>

            <div className="filter-buttons">
              <button
                className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => onTabFilter?.('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${activeTab === 'overdue' ? 'active' : ''}`}
                onClick={() => onTabFilter?.('overdue')}
              >
                Overdue
              </button>
              <button
                className={`filter-btn ${activeTab === 'due-soon' ? 'active' : ''}`}
                onClick={() => onTabFilter?.('due-soon')}
              >
                Due Soon
              </button>
              <button
                className={`filter-btn ${activeTab === 'up-to-date' ? 'active' : ''}`}
                onClick={() => onTabFilter?.('up-to-date')}
              >
                Up to Date
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="advanced-filters">
              <div className="filter-row">
                <div className="filter-group">
                  <label>Report Type</label>
                  <div className="filter-options">
                    <button
                      className={`filter-option ${!filters?.reportType || filters.reportType === 'Medical Report' ? 'active' : ''}`}
                      onClick={() => safeOnFilterChange('reportType', 'Medical Report')}
                    >
                      Medical Report
                    </button>
                    <button
                      className={`filter-option ${filters?.reportType === 'Lab Test' ? 'active' : ''}`}
                      onClick={() => safeOnFilterChange('reportType', 'Lab Test')}
                    >
                      Lab Test
                    </button>
                    <button
                      className={`filter-option ${filters?.reportType === 'Prescription' ? 'active' : ''}`}
                      onClick={() => safeOnFilterChange('reportType', 'Prescription')}
                    >
                      Prescription
                    </button>
                    <button
                      className={`filter-option ${filters?.reportType === 'Vaccination Record' ? 'active' : ''}`}
                      onClick={() => safeOnFilterChange('reportType', 'Vaccination Record')}
                    >
                      Vaccination Record
                    </button>
                    <button
                      className={`filter-option ${filters?.reportType === 'Doctor\'s Visit Summary' ? 'active' : ''}`}
                      onClick={() => safeOnFilterChange('reportType', 'Doctor\'s Visit Summary')}
                    >
                      Doctor's Visit Summary
                    </button>
                  </div>
                </div>
              </div>

              <div className="filter-row">
                <div className="filter-group">
                  <label>Date Range</label>
                  <div className="date-inputs">
                    <div className="date-input-wrapper" style={{ position: 'relative' }}>
                      <div className="date-input">
                        <input
                          type="text"
                          placeholder="Start date (DD/MM/YYYY)"
                          value={formatDateForDisplay(filters?.startDate)}
                          readOnly
                        />
                        <img
                          src={calendarIcon}
                          alt="Calendar"
                          className="calendar-icon"
                          style={{ cursor: 'pointer', filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)' }}
                          onClick={() => handleCalendarClick('start')}
                        />
                      </div>
                      {showDatePicker.start && (
                        <div className="date-picker-dropdown">
                          <input
                            type="date"
                            min={getUserJoinDate()}
                            max={getTodayDate()}
                            value={filters?.startDate || ''}
                            onChange={(e) => handleDateSelect('start', e.target.value)}
                            onBlur={(e) => {
                              // Keep picker open if user is still interacting with it
                              setTimeout(() => {
                                if (!e.target.matches(':focus')) {
                                  setShowDatePicker(prev => ({ ...prev, start: false }));
                                }
                              }, 100);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <span className="date-separator">to</span>
                    <div className="date-input-wrapper" style={{ position: 'relative' }}>
                      <div className="date-input">
                        <input
                          type="text"
                          placeholder="End date (DD/MM/YYYY)"
                          value={formatDateForDisplay(filters?.endDate)}
                          readOnly
                        />
                        <img
                          src={calendarIcon}
                          alt="Calendar"
                          className="calendar-icon"
                          style={{ cursor: 'pointer', filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)' }}
                          onClick={() => handleCalendarClick('end')}
                        />
                      </div>
                      {showDatePicker.end && (
                        <div className="date-picker-dropdown">
                          <input
                            type="date"
                            min={filters?.startDate || getUserJoinDate()}
                            max={getTodayDate()}
                            value={filters?.endDate || ''}
                            onChange={(e) => handleDateSelect('end', e.target.value)}
                            onBlur={(e) => {
                              // Keep picker open if user is still interacting with it
                              setTimeout(() => {
                                if (!e.target.matches(':focus')) {
                                  setShowDatePicker(prev => ({ ...prev, end: false }));
                                }
                              }, 100);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="filter-actions">
                <button
                  className="btn-reset"
                  onClick={safeOnClearFilters}
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Sort Panel */}
          {showSort && (
            <div className="sort-panel">
              <div className="sort-row">
                <div className="sort-group">
                  <label>Sort By</label>
                  <select
                    value={sortBy || 'report_date'}
                    onChange={(e) => safeOnSort(e.target.value)}
                  >
                    <option value="report_date">Report Date</option>
                    <option value="created_at">Upload Date</option>
                    <option value="report_title">Report Title</option>
                    <option value="report_type">Report Type</option>
                    <option value="health_report_status">Status</option>
                  </select>
                </div>

                <div className="sort-group">
                  <label>Sort Order</label>
                  <div className="sort-order-buttons">
                    <button
                      className={`sort-order-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                      onClick={() => safeOnSort(sortBy, 'asc')}
                    >
                      <img src={ascIcon} alt="Ascending" style={{
                        width: '24px',
                        height: '18px',
                        marginRight: '8px',
                        filter: sortOrder === 'asc' ? 'brightness(0) invert(1)' : 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)'
                      }} /> Ascending
                    </button>
                    <button
                      className={`sort-order-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                      onClick={() => safeOnSort(sortBy, 'desc')}
                    >
                      <img src={descIcon} alt="Descending" style={{
                        width: '24px',
                        height: '18px',
                        marginRight: '8px',
                        filter: sortOrder === 'desc' ? 'brightness(0) invert(1)' : 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)'
                      }} /> Descending
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div className="results-table">
            <div className="table-header-row">
              <div className="table-header-col">Report Title</div>
              <div className="table-header-col">User Name</div>
              <div className="table-header-col">Report Date</div>
              <div className="table-header-col">Upload Date</div>
              <div className="table-header-col">Report Status</div>
              <div className="table-header-col">Actions</div>
            </div>

            <div className="table-body">
              {reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div key={report.id} className="table-data-row">
                    <div className="table-data-col">
                      <div className="report-title">{report.report_title || report.report_type || 'Health Report'}</div>
                      <div className="report-ref">Ref: {report.id.slice(-8).toUpperCase()}</div>
                    </div>
                    <div className="table-data-col">
                      <div className="user-name">{user?.full_name || user?.email || 'N/A'}</div>
                    </div>
                    <div className="table-data-col">
                      {new Date(report.report_date).toLocaleDateString('en-GB')}
                    </div>
                    <div className="table-data-col">
                      {new Date(report.created_at).toLocaleDateString('en-GB')}
                    </div>
                    <div className="table-data-col"><StatusBadge status={report.health_report_status || report.due_status || 'Up to Date'} /></div>
                    <div className="table-data-col table-actions">
                      <button
                        className="btn-secondary btn-action"
                        onClick={() => safeOnDownload(report.id)}
                      >
                        View
                      </button>
                      <button
                        className="btn-primary btn-action"
                        onClick={() => safeOnShareClick(report)}
                      >
                        Share
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="table-data-row">
                  <div className="table-data-col" style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#666',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    No health reports found
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            uploadForm={uploadForm}
            onCancel={onCancelUploadModal}
            onFormChange={onUploadFormChange}
            onSubmit={onUploadSubmit}
            applicationId={applicationId}
          />
        )}

        {/* Share Modal */}
        {showShareModal && (
          <ShareModal
            show={showShareModal}
            shareForm={shareForm}
            errors={errors}
            onCancel={onCancelShareModal}
            onShareFormChange={onShareFormChange}
            onShareFormSubmit={onShareFormSubmit}
            errorMessage={errorMessage}
            successMessage={successMessage}
            shareLinks={shareLinks}
            isShareLinksLoading={isShareLinksLoading}
            onCopyShareLink={onCopyShareLink}
            onRevokeShareLink={onRevokeShareLink}
          />
        )}

        {/* Reminder Modal */}
        {showReminderModal && (
          <ReminderModal
            show={showReminderModal}
            reminderForm={reminderForm}
            editingReminder={editingReminder}
            errors={errors}
            onCancel={onCancelReminderModal}
            onFormChange={onReminderFormChange}
            onSubmit={onSubmitReminder}
            successMessage={successMessage}
            showSuccessOverlay={showSuccessOverlay}
          />
        )}

        {/* PDF Viewer Modal */}
        {showPDFViewer && viewingReportUrl && (
          <div className="modal-overlay pdf-viewer-overlay" onClick={onClosePDFViewer}>
            <div className="modal-content pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Health Report</h3>
                <button className="close-button" onClick={onClosePDFViewer}>×</button>
              </div>

              {/* Display flagged reason if report is flagged */}
              {viewingReport && viewingReport.health_report_status === 'Flagged' && viewingReport.flagged_reason && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: '8px',
                  padding: '16px',
                  margin: '0 24px 16px 24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}>
                  <img
                    src={warningIcon}
                    alt="Warning"
                    style={{
                      width: '20px',
                      height: '20px',
                      marginTop: '2px',
                      flexShrink: 0
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      color: '#991B1B',
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      This report has been flagged
                    </div>
                    <div style={{
                      color: '#7F1D1D',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      <strong>Reason:</strong> {viewingReport.flagged_reason}
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-body pdf-viewer-body">
                <iframe
                  src={viewingReportUrl}
                  style={{
                    width: '100%',
                    height: '80vh',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                  title="Health Report PDF"
                />
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={onClosePDFViewer}
                >
                  Close
                </button>
                {viewingReport && viewingReport.health_report_status === 'Flagged' && (
                  <button
                    className="btn btn-warning"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onReuploadReport) {
                        onReuploadReport(viewingReport.id);
                      }
                    }}
                    style={{
                      backgroundColor: '#F59E0B',
                      color: '#FFFFFF',
                      cursor: 'pointer'
                    }}
                  >
                    Reupload Document
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => window.open(viewingReportUrl, '_blank')}
                >
                  Open in New Tab
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Archived Reports Modal */}
        {showArchivedModal && (
          <div className="modal-overlay" onClick={onCloseArchivedModal}>
            <div className="modal-content archived-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>All Archived Health Reports</h3>
                <button className="close-button" onClick={onCloseArchivedModal}>×</button>
              </div>

              <div className="modal-body archived-modal-body">
                {archivedReports.length > 0 ? (
                  <div className="archived-table">
                    <div className="table-header">
                      <div className="table-col">Report Title</div>
                      <div className="table-col">Date</div>
                      <div className="table-col">Actions</div>
                    </div>
                    {archivedReports.map((report) => (
                      <div key={report.id} className="table-row">
                        <div className="table-col">{report.report_title || report.report_type || 'Medical Report'}</div>
                        <div className="table-col">{new Date(report.report_date).toLocaleDateString('en-GB')}</div>
                        <div className="table-col table-actions">
                          <button
                            className="btn-secondary btn-action"
                            onClick={() => onDownload?.(report.id)}
                          >
                            View
                          </button>
                          <button
                            className="btn-primary btn-action"
                            onClick={() => {
                              onCloseArchivedModal?.();
                              onShareClick?.(report);
                            }}
                          >
                            Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-data-message">
                    <p>No archived reports available</p>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={onCloseArchivedModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reupload Confirmation Modal */}
        {showReuploadConfirm && reuploadFileData && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Confirm File Reupload</h3>
              <p>Please review the file details before reuploading:</p>

              <div className="file-preview-section" style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '20px',
                margin: '20px 0'
              }}>
                <div className="file-preview-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>File Name:</span>
                  <span style={{ color: '#6B7280' }}>{reuploadFileData.name}</span>
                </div>

                <div className="file-preview-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>File Size:</span>
                  <span style={{ color: '#6B7280' }}>
                    {(reuploadFileData.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>

                <div className="file-preview-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontWeight: '600', color: '#374151' }}>File Type:</span>
                  <span style={{ color: '#6B7280' }}>
                    {reuploadFileData.type || 'application/pdf'}
                  </span>
                </div>
              </div>

              <div style={{
                backgroundColor: '#FEF3C7',
                border: '1px solid #FDE047',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <p style={{ margin: 0, fontSize: '14px', color: '#78350F' }}>
                  Reuploading will replace the current file and reset the report status to Pending for re-review.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={onReuploadCancel}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-warning"
                  onClick={onReuploadConfirm}
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#FFFFFF'
                  }}
                >
                  Confirm Reupload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// ADMIN VIEW COMPONENT
// ============================================================================

function AdminHealthReportDashboardView({
  // Data
  user,
  isLoading,
  statistics,
  reports,
  selectedReport,
  alerts,
  errorMessage,
  successMessage,
  searchKey,
  filters,
  sortBy,
  sortOrder,
  activeTab = 'reports',
  showFilters,
  showSort,
  showApprovalConfirm,
  showArchiveConfirm,
  showFlagModal,
  flagReason,
  actionReport,
  showSuccessOverlay,
  showPDFViewer,
  viewingReportUrl,
  viewingReport,

  // Handlers
  onSearchChange,
  onSearch,
  onClearSearch,
  onSetShowFilters,
  onSetShowSort,
  onTabFilter,
  onFilterChange,
  onClearFilters,
  onSort,
  onReportSelect,
  onApproveClick,
  onApproveConfirm,
  onFlagClick,
  onFlagConfirm,
  onArchiveClick,
  onArchiveConfirm,
  onCancelAdminAction,
  onFlagReasonChange,
  onViewReport,
  onShareClick,
  onShareReport,
  onArchiveReport,
  onDownload,
  onClosePDFViewer,
  onGenerateReport
}) {
  // Local UI-only state (date picker toggles)
  const [showDatePicker, setShowDatePicker] = useState({ start: false, end: false })

  // Safe fallbacks to avoid undefined access
  const safeOnSearchChange = onSearchChange || (() => { })
  const safeOnSearch = onSearch || (() => { })
  const safeOnClearSearch = onClearSearch || (() => { })
  const safeOnSetShowFilters = onSetShowFilters || (() => { })
  const safeOnSetShowSort = onSetShowSort || (() => { })
  const safeOnTabFilter = onTabFilter || (() => { })
  const safeOnFilterChange = onFilterChange || (() => { })
  const safeOnClearFilters = onClearFilters || (() => { })
  const safeOnSort = onSort || (() => { })
  const safeOnReportSelect = onReportSelect || (() => { })
  const safeOnApproveClick = onApproveClick || (() => { })
  const safeOnApproveConfirm = onApproveConfirm || (() => { })
  const safeOnFlagClick = onFlagClick || (() => { })
  const safeOnFlagConfirm = onFlagConfirm || (() => { })
  const safeOnArchiveClick = onArchiveClick || (() => { })
  const safeOnArchiveConfirm = onArchiveConfirm || (() => { })
  const safeOnCancelAdminAction = onCancelAdminAction || (() => { })
  const safeOnFlagReasonChange = onFlagReasonChange || (() => { })
  const safeOnViewReport = onViewReport || (() => { })
  const safeOnShareClick = onShareClick || (() => { })
  const safeOnShareReport = onShareReport || (() => { })
  const safeOnArchiveReport = onArchiveReport || (() => { })
  const safeOnDownload = onDownload || (() => { })
  const safeOnGenerateReport = onGenerateReport || (() => { })

  const formatDateForDisplay = useCallback((dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB')
  }, [])

  const handleCalendarClick = useCallback((type) => {
    setShowDatePicker((prev) => ({ ...prev, [type]: !prev[type] }))
  }, [])

  const handleDateSelect = useCallback((type, value) => {
    const dateField = type === 'start' ? 'startDate' : 'endDate'
    safeOnFilterChange(dateField, value)

    if (value && value.length === 10 && value.includes('-')) {
      setShowDatePicker((prev) => ({ ...prev, [type]: false }))
    }
  }, [safeOnFilterChange])

  const getUserJoinDate = useCallback(() => {
    if (user?.created_at) {
      const joinDate = new Date(user.created_at)
      joinDate.setFullYear(joinDate.getFullYear() - 10)
      return joinDate.toISOString().split('T')[0]
    }
    const tenYearsAgo = new Date()
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
    return tenYearsAgo.toISOString().split('T')[0]
  }, [user])

  const getTodayDate = useCallback(() => new Date().toISOString().split('T')[0], [])

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.date-input-wrapper') &&
        !event.target.closest('.date-picker-dropdown') &&
        !event.target.matches('input[type="date"]')) {
        setShowDatePicker({ start: false, end: false })
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  // Loading state
  if (isLoading) {
    return (
      <div className="health-report-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading health reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="health-report-container">
      {/* Success Overlay */}
      <SuccessOverlay show={showSuccessOverlay} message={successMessage} />

      {/* Alerts and Messages */}
      {alerts && alerts.length > 0 && <AlertMessage alerts={alerts} />}
      {successMessage && (
        <div className="alert alert-success">
          <span>✓</span> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="alert alert-error">
          <span>⚠</span> {errorMessage}
        </div>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Heading Section */}
        <div className="section-heading">
          <h1>Health Report Dashboard</h1>
        </div>

        {/* Statistics Cards Section */}
        <div className="statistics-section">
          <div className="statistics-cards">
            <div className="stat-card">
              <div className="stat-label">Pending Reports</div>
              <div className="stat-value">{statistics?.pending || 0}</div>
              <div className="stat-sublabel">Awaiting review</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Reviewed</div>
              <div className="stat-value">{statistics?.reviewed || 0}</div>
              <div className="stat-sublabel">Active health records</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Flagged</div>
              <div className="stat-value">{statistics?.flagged || 0}</div>
              <div className="stat-sublabel">Requires attention</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Due Soon</div>
              <div className="stat-value">{statistics?.healthReportDueSoon || 0}</div>
              <div className="stat-sublabel">Requires reminder</div>
            </div>
          </div>
        </div>

        {/* Search Health Report Section */}
        <div className="search-section">
          <div className="search-header">
            <h2>Health report search</h2>
            <button
              className="btn-clear-filters"
              onClick={safeOnClearFilters}
            >
              Clear all filters
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-input-group">
              <div className="search-input">
                <img src={searchIcon} alt="Search" className="search-icon" style={{ filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)', marginLeft: '12px' }} />
                <input
                  type="text"
                  placeholder="Search health reports, titles"
                  value={searchKey || ''}
                  onChange={(e) => {
                    e.preventDefault();
                    safeOnSearchChange(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      safeOnSearch();
                    }
                  }}
                  onBlur={() => {
                    // Trigger search when user leaves the input field
                    safeOnSearch();
                  }}
                />
                <button
                  className="clear-search"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    safeOnClearSearch();
                  }}
                  type="button"
                  aria-label="Clear search"
                  style={{
                    display: searchKey && searchKey.length > 0 ? 'block' : 'none'
                  }}
                >
                  ×
                </button>
              </div>

              <button
                className="btn-filter"
                onClick={() => {
                  if (showSort) {
                    onSetShowSort?.(false)
                  }
                  onSetShowFilters?.(!showFilters)
                }}
              >
                <img src={filterIcon} alt="Filter" style={{ filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)' }} />
                {showFilters ? 'Hide' : 'Show'} Filter
              </button>

              <button
                className="btn-sort"
                onClick={() => {
                  if (showFilters) {
                    onSetShowFilters?.(false)
                  }
                  onSetShowSort?.(!showSort)
                }}
              >
                <img src={sortIcon} alt="Sort" style={{ filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)' }} />
                {showSort ? 'Hide' : 'Show'} Sort
              </button>
            </div>

            <div className="filter-buttons">
              <button
                className={`filter-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => safeOnTabFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${activeTab === 'overdue' ? 'active' : ''}`}
                onClick={() => safeOnTabFilter('overdue')}
              >
                Overdue
              </button>
              <button
                className={`filter-btn ${activeTab === 'due-soon' ? 'active' : ''}`}
                onClick={() => safeOnTabFilter('due-soon')}
              >
                Due Soon
              </button>
              <button
                className={`filter-btn ${activeTab === 'up-to-date' ? 'active' : ''}`}
                onClick={() => safeOnTabFilter('up-to-date')}
              >
                Up to Date
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="advanced-filters">
              <div className="filter-row">
                <div className="filter-group">
                  <label>Report Type</label>
                  <div className="filter-options">
                    <button
                      className={`filter-option ${!filters?.reportType || filters.reportType === 'Medical Report' ? 'active' : ''}`}
                      onClick={() => onFilterChange?.('reportType', 'Medical Report')}
                    >
                      Medical Report
                    </button>
                    <button
                      className={`filter-option ${filters?.reportType === 'Lab Test' ? 'active' : ''}`}
                      onClick={() => onFilterChange?.('reportType', 'Lab Test')}
                    >
                      Lab Test
                    </button>
                    <button
                      className={`filter-option ${filters?.reportType === 'Prescription' ? 'active' : ''}`}
                      onClick={() => onFilterChange?.('reportType', 'Prescription')}
                    >
                      Prescription
                    </button>
                    <button
                      className={`filter-option ${filters?.reportType === 'Vaccination Record' ? 'active' : ''}`}
                      onClick={() => onFilterChange?.('reportType', 'Vaccination Record')}
                    >
                      Vaccination Record
                    </button>
                    <button
                      className={`filter-option ${filters?.reportType === 'Doctor\'s Visit Summary' ? 'active' : ''}`}
                      onClick={() => onFilterChange?.('reportType', 'Doctor\'s Visit Summary')}
                    >
                      Doctor's Visit Summary
                    </button>
                  </div>
                </div>
              </div>

              <div className="filter-row">
                <div className="filter-group">
                  <label>Date Range</label>
                  <div className="date-inputs">
                    <div className="date-input-wrapper" style={{ position: 'relative' }}>
                      <div className="date-input">
                        <input
                          type="text"
                          placeholder="Start date (DD/MM/YYYY)"
                          value={formatDateForDisplay(filters?.startDate)}
                          readOnly
                        />
                        <img
                          src={calendarIcon}
                          alt="Calendar"
                          className="calendar-icon"
                          style={{ cursor: 'pointer', filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)' }}
                          onClick={() => handleCalendarClick('start')}
                        />
                      </div>
                      {showDatePicker.start && (
                        <div className="date-picker-dropdown">
                          <input
                            type="date"
                            min={getUserJoinDate()}
                            max={getTodayDate()}
                            value={filters?.startDate || ''}
                            onChange={(e) => handleDateSelect('start', e.target.value)}
                            onBlur={(e) => {
                              // Keep picker open if user is still interacting with it
                              setTimeout(() => {
                                if (!e.target.matches(':focus')) {
                                  setShowDatePicker(prev => ({ ...prev, start: false }));
                                }
                              }, 100);
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <span className="date-separator">to</span>
                    <div className="date-input-wrapper" style={{ position: 'relative' }}>
                      <div className="date-input">
                        <input
                          type="text"
                          placeholder="End date (DD/MM/YYYY)"
                          value={formatDateForDisplay(filters?.endDate)}
                          readOnly
                        />
                        <img
                          src={calendarIcon}
                          alt="Calendar"
                          className="calendar-icon"
                          style={{ cursor: 'pointer', filter: 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)' }}
                          onClick={() => handleCalendarClick('end')}
                        />
                      </div>
                      {showDatePicker.end && (
                        <div className="date-picker-dropdown">
                          <input
                            type="date"
                            min={filters?.startDate || getUserJoinDate()}
                            max={getTodayDate()}
                            value={filters?.endDate || ''}
                            onChange={(e) => handleDateSelect('end', e.target.value)}
                            onBlur={(e) => {
                              // Keep picker open if user is still interacting with it
                              setTimeout(() => {
                                if (!e.target.matches(':focus')) {
                                  setShowDatePicker(prev => ({ ...prev, end: false }));
                                }
                              }, 100);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="filter-actions">
                <button
                  className="btn-reset"
                  onClick={onClearFilters}
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Sort Panel */}
          {showSort && (
            <div className="sort-panel">
              <div className="sort-row">
                <div className="sort-group">
                  <label>Sort By</label>
                  <select
                    value={sortBy || 'report_date'}
                    onChange={(e) => onSort?.(e.target.value)}
                  >
                    <option value="report_date">Report Date</option>
                    <option value="created_at">Upload Date</option>
                    <option value="report_title">Report Title</option>
                    <option value="report_type">Report Type</option>
                    <option value="health_report_status">Status</option>
                  </select>
                </div>

                <div className="sort-group">
                  <label>Sort Order</label>
                  <div className="sort-order-buttons">
                    <button
                      className={`sort-order-btn ${sortOrder === 'asc' ? 'active' : ''}`}
                      onClick={() => onSort?.(sortBy, 'asc')}
                    >
                      <img src={ascIcon} alt="Ascending" style={{
                        width: '24px',
                        height: '18px',
                        marginRight: '8px',
                        filter: sortOrder === 'asc' ? 'brightness(0) invert(1)' : 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)'
                      }} /> Ascending
                    </button>
                    <button
                      className={`sort-order-btn ${sortOrder === 'desc' ? 'active' : ''}`}
                      onClick={() => onSort?.(sortBy, 'desc')}
                    >
                      <img src={descIcon} alt="Descending" style={{
                        width: '24px',
                        height: '18px',
                        marginRight: '8px',
                        filter: sortOrder === 'desc' ? 'brightness(0) invert(1)' : 'invert(0.4) sepia(0) saturate(0) hue-rotate(0deg) brightness(0.6)'
                      }} /> Descending
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Table */}
          <div className="results-table">
            <div className="table-header-row">
              <div className="table-header-col">Report Title</div>
              <div className="table-header-col">User Name</div>
              <div className="table-header-col">Report Date</div>
              <div className="table-header-col">Upload Date</div>
              <div className="table-header-col">Report Status</div>
              <div className="table-header-col">Actions</div>
            </div>

            <div className="table-body">
              {reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div key={report.id} className="table-data-row">
                    <div className="table-data-col">
                      <div className="report-title">{report.report_title || report.report_type || 'Health Report'}</div>
                      <div className="report-ref">Ref: {report.id.slice(-8).toUpperCase()}</div>
                    </div>
                    <div className="table-data-col">
                      <div className="user-name">{report.userData?.full_name || 'N/A'}</div>
                      <div className="user-email" style={{ fontSize: '0.85rem', color: '#666' }}>{report.userData?.email || ''}</div>
                    </div>
                    <div className="table-data-col">
                      {new Date(report.report_date).toLocaleDateString('en-GB')}
                    </div>
                    <div className="table-data-col">
                      {new Date(report.created_at).toLocaleDateString('en-GB')}
                    </div>
                    <div className="table-data-col"><StatusBadge status={report.health_report_status || report.due_status || 'Up to Date'} /></div>
                    <div className="table-data-col table-actions">
                      <button
                        className="btn-secondary btn-action"
                        onClick={() => safeOnDownload(report.id)}
                      >
                        View
                      </button>
                      <button
                        className="btn-approve"
                        onClick={() => safeOnApproveClick(report)}
                        disabled={report.health_report_status?.toLowerCase() === 'flagged' || report.health_report_status?.toLowerCase() === 'reviewed'}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-flag"
                        onClick={() => safeOnFlagClick(report)}
                        disabled={report.health_report_status?.toLowerCase() === 'flagged' || report.health_report_status?.toLowerCase() === 'reviewed'}
                      >
                        Flag
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="table-data-row">
                  <div className="table-data-col" style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#666',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    No health reports found. Upload your first report to get started.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modals */}

      {/* Approval Confirmation Modal */}
      {showApprovalConfirm && actionReport && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Approve Health Report</h3>
            <p>Are you sure you want to approve this health report?</p>
            <div className="report-preview">
              <p><strong>Report Type:</strong> {actionReport.report_type}</p>
              <p><strong>Date:</strong> {new Date(actionReport.report_date).toLocaleDateString('en-GB')}</p>
              <p><strong>Notes:</strong> {actionReport.notes || 'No notes'}</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onCancelAdminAction}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onApproveConfirm}>
                Approve Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flag Modal */}
      {showFlagModal && actionReport && (
        <div className="flag-modal-overlay">
          <div className="flag-modal-content">
            <h3 className="flag-modal-header">Flag Health Report</h3>

            <div className="flag-modal-body">
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                Please provide a reason for flagging this report:
              </p>

              <div className="report-preview" style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Report Type:</strong> {actionReport.report_type}
                </p>
                <p style={{ margin: '0.5rem 0' }}>
                  <strong>Date:</strong> {new Date(actionReport.report_date).toLocaleDateString('en-GB')}
                </p>
              </div>

              <label className="flag-reason-label">Reason for Flagging:</label>
              <textarea
                className="flag-reason-input"
                placeholder="Enter reason for flagging (required)"
                value={flagReason}
                onChange={(e) => onFlagReasonChange(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="flag-modal-footer">
              <button className="btn-flag-cancel" onClick={onCancelAdminAction}>
                Cancel
              </button>
              <button
                className="btn-flag-submit"
                onClick={onFlagConfirm}
                disabled={!flagReason.trim()}
              >
                Flag Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && actionReport && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Archive Health Report</h3>
            <p>Are you sure you want to archive this health report?</p>
            <div className="report-preview">
              <p><strong>Report Type:</strong> {actionReport.report_type}</p>
              <p><strong>Date:</strong> {new Date(actionReport.report_date).toLocaleDateString('en-GB')}</p>
              <p><strong>Notes:</strong> {actionReport.notes || 'No notes'}</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onCancelAdminAction}>
                Cancel
              </button>
              <button className="btn btn-warning" onClick={onArchiveConfirm}>
                Archive Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && viewingReportUrl && (
        <div className="modal-overlay pdf-viewer-overlay" onClick={onClosePDFViewer}>
          <div className="modal-content pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Health Report</h3>
              <button className="close-button" onClick={onClosePDFViewer}>×</button>
            </div>

            <div className="modal-body pdf-viewer-body">
              <iframe
                src={viewingReportUrl}
                style={{
                  width: '100%',
                  height: '80vh',
                  border: 'none',
                  borderRadius: '8px'
                }}
                title="Health Report PDF"
              />
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={onClosePDFViewer}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => window.open(viewingReportUrl, '_blank')}
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

export default function HealthMonitoringView({
  // User role
  userRole,
  user, // Add user prop

  // Admin props
  isLoading,
  statistics,
  selectedReport,
  activeTab,
  showApprovalConfirm,
  showArchiveConfirm,
  showFlagModal,
  flagReason,
  actionReport,
  showReuploadConfirm,
  reuploadFileData,
  onApproveClick,
  onApproveConfirm,
  onFlagClick,
  onFlagConfirm,
  onArchiveClick,
  onArchiveConfirm,
  onCancelAdminAction,
  onFlagReasonChange,
  onTabChange,

  // Common and user props
  alerts,
  errorMessage,
  reports,
  uploadForm,
  shareForm,
  shareLinks,
  isShareLinksLoading,
  multiUploadForm,
  searchKey,
  filters,
  sortBy,
  sortOrder,
  showUploadModal,
  showShareModal,
  showPDFViewer,
  viewingReportUrl,
  viewingReport,
  showFilters,
  showSort,
  isDragging,
  errors,
  successMessage,
  showSuccessOverlay,
  applicationId, // Add applicationId prop

  // Reminder props
  reminders,
  upcomingReminders,
  overdueReminders,
  reminderStats,
  showReminderModal,
  reminderForm,
  editingReminder,
  selectedReminderCategory,

  // User handlers
  onUploadClick,
  onCancelUploadModal,
  onClosePDFViewer,
  onUploadFormChange,
  onMultiUploadFormChange,
  onMultipleFileUpload,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onUploadSubmit,
  onCancelShareModal,
  onCopyShareLink,
  onRevokeShareLink,
  onShareFormChange,
  onReminderCategoryFilter,
  onShareFormSubmit,
  onSearchChange,
  onSearch,
  onFilter,
  onSetShowFilters,
  onSetShowSort,
  onSort,
  onDownload,
  onShareClick,
  onDelete,

  // Reminder handlers
  onCreateReminder,
  onEditReminder,
  onDeleteReminder,
  onToggleReminder,
  onReminderFormChange,
  onSubmitReminder,
  onCancelReminderModal,

  // Admin handlers
  onFilterChange,
  onClearFilters,
  onTabFilter,
  onReportSelect,
  onViewReport,
  onShareReport,
  onArchiveReport,
  onClearSearch,
  onViewAllArchived,
  onCloseArchivedModal,
  showArchivedModal,
  onReuploadReport,
  onReuploadConfirm,
  onReuploadCancel,

  // Aliases
  onAdminSort,
  onGenerateReport
}) {
  // Provide default handlers if not passed as props
  const safeOnSearchChange = onSearchChange || (() => { });
  const safeOnSearch = onSearch || (() => { });
  const safeOnClearSearch = onClearSearch || (() => { });
  const safeOnGenerateReport = onGenerateReport || (() => { });
  const safeOnShareReport = onShareReport || (() => { });
  const safeOnArchiveReport = onArchiveReport || (() => { });

  // Render Admin Dashboard if user is admin
  if (userRole === 'admin') {
    return (
      <AdminHealthReportDashboardView
        user={user}
        isLoading={isLoading}
        statistics={statistics}
        reports={reports}
        selectedReport={selectedReport}
        alerts={alerts}
        errorMessage={errorMessage}
        successMessage={successMessage}
        searchKey={searchKey}
        filters={filters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        activeTab={activeTab}
        showFilters={showFilters}
        showSort={showSort}
        showApprovalConfirm={showApprovalConfirm}
        showArchiveConfirm={showArchiveConfirm}
        showFlagModal={showFlagModal}
        flagReason={flagReason}
        actionReport={actionReport}
        showSuccessOverlay={showSuccessOverlay}
        showPDFViewer={showPDFViewer}
        viewingReportUrl={viewingReportUrl}
        viewingReport={viewingReport}
        onSearchChange={safeOnSearchChange}
        onSearch={safeOnSearch}
        onClearSearch={safeOnClearSearch}
        onSetShowFilters={onSetShowFilters}
        onSetShowSort={onSetShowSort}
        onTabFilter={onTabFilter}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        onSort={onSort || onAdminSort}
        onReportSelect={onReportSelect}
        onApproveClick={onApproveClick}
        onApproveConfirm={onApproveConfirm}
        onFlagClick={onFlagClick}
        onFlagConfirm={onFlagConfirm}
        onArchiveClick={onArchiveClick}
        onArchiveConfirm={onArchiveConfirm}
        onCancelAdminAction={onCancelAdminAction}
        onFlagReasonChange={onFlagReasonChange}
        onViewReport={onViewReport}
        onShareClick={onShareClick}
        onShareReport={safeOnShareReport}
        onArchiveReport={safeOnArchiveReport}
        onDownload={onDownload}
        onClosePDFViewer={onClosePDFViewer}
        onGenerateReport={safeOnGenerateReport}
      />
    )
  }

  // Render User Health Monitoring View otherwise
  return (
    <UserHealthReportView
      alerts={alerts}
      successMessage={successMessage}
      showSuccessOverlay={showSuccessOverlay}
      errorMessage={errorMessage}
      reports={reports}
      uploadForm={uploadForm}
      shareForm={shareForm}
      shareLinks={shareLinks}
      isShareLinksLoading={isShareLinksLoading}
      multiUploadForm={multiUploadForm}
      searchKey={searchKey}
      filters={filters}
      sortBy={sortBy}
      sortOrder={sortOrder}
      showUploadModal={showUploadModal}
      showShareModal={showShareModal}
      showPDFViewer={showPDFViewer}
      viewingReportUrl={viewingReportUrl}
      viewingReport={viewingReport}
      showFilters={showFilters}
      showSort={showSort}
      isDragging={isDragging}
      errors={errors}
      activeTab={activeTab || 'archived'}
      statistics={statistics}
      user={user}
      applicationId={applicationId}
      showArchivedModal={showArchivedModal}
      showReuploadConfirm={showReuploadConfirm}
      reuploadFileData={reuploadFileData}
      reminders={reminders}
      upcomingReminders={upcomingReminders}
      overdueReminders={overdueReminders}
      reminderStats={reminderStats}
      showReminderModal={showReminderModal}
      reminderForm={reminderForm}
      editingReminder={editingReminder}
      selectedReminderCategory={selectedReminderCategory}
      onUploadClick={onUploadClick}
      onCancelUploadModal={onCancelUploadModal}
      onClosePDFViewer={onClosePDFViewer}
      onUploadFormChange={onUploadFormChange}
      onMultiUploadFormChange={onMultiUploadFormChange}
      onMultipleFileUpload={onMultipleFileUpload}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onFileSelect={onFileSelect}
      onUploadSubmit={onUploadSubmit}
      onCancelShareModal={onCancelShareModal}
      onShareFormChange={onShareFormChange}
      onShareFormSubmit={onShareFormSubmit}
      onCopyShareLink={onCopyShareLink}
      onRevokeShareLink={onRevokeShareLink}
      onSearchChange={safeOnSearchChange}
      onSearch={safeOnSearch}
      onClearSearch={safeOnClearSearch}
      onFilterChange={onFilterChange}
      onClearFilters={onClearFilters}
      onTabFilter={onTabFilter}
      onFilter={onFilter}
      onSetShowFilters={onSetShowFilters}
      onSetShowSort={onSetShowSort}
      onSort={onSort}
      onDownload={onDownload}
      onShareClick={onShareClick}
      onDelete={onDelete}
      onTabChange={onTabChange}
      onViewReport={onViewReport}
      onCreateReminder={onCreateReminder}
      onEditReminder={onEditReminder}
      onDeleteReminder={onDeleteReminder}
      onToggleReminder={onToggleReminder}
      onReminderFormChange={onReminderFormChange}
      onSubmitReminder={onSubmitReminder}
      onCancelReminderModal={onCancelReminderModal}
      onReminderCategoryFilter={onReminderCategoryFilter}
      onViewAllArchived={onViewAllArchived}
      onCloseArchivedModal={onCloseArchivedModal}
      onReuploadReport={onReuploadReport}
      onReuploadConfirm={onReuploadConfirm}
      onReuploadCancel={onReuploadCancel}
    />
  )
}

// Export AdminHealthReportDashboardView as a named export for standalone use
export { AdminHealthReportDashboardView }
