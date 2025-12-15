// HealthReport View - Pure Presentational Component
// Receives all props from HealthReportController
// NO business logic - only UI rendering
// Now includes both User and Admin views with conditional rendering based on userRole

import { useRef } from 'react'
import '../components/application/maintainApplication.css'
import './AdminHealthReportDashboard.css'

// Embedded CSS Styles
const styles = `
/* Health Report View Styles */

/* ============================================================================
   CONTAINER & LAYOUT
   ============================================================================ */

.health-report-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  min-height: 100vh;
}

.health-report-container.drag-active {
  pointer-events: none;
}

/* ============================================================================
   HEADER
   ============================================================================ */

.health-report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.health-report-header h1 {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.btn-help,
.btn-exit {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-help:hover {
  background: #f0f0f0;
  border-color: #007bff;
  color: #007bff;
}

.btn-exit:hover {
  background: #f0f0f0;
  border-color: #666;
}

/* ============================================================================
   ALERTS & MESSAGES
   ============================================================================ */

.health-alerts {
  margin-bottom: 1.5rem;
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.alert-error {
  background: #fee;
  border: 1px solid #fcc;
  color: #c00;
}

.alert-warning {
  background: #fff3cd;
  border: 1px solid #ffe69c;
  color: #856404;
}

.alert-icon {
  font-size: 1.25rem;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  animation: slideIn 0.3s ease;
}

.success-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: #fee;
  border: 1px solid #fcc;
  color: #c00;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  animation: slideIn 0.3s ease;
}

.error-icon {
  font-size: 1.25rem;
  font-weight: bold;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================================================
   LOADING STATE
   ============================================================================ */

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ============================================================================
   UPLOAD SECTION
   ============================================================================ */

.upload-section {
  margin-bottom: 2rem;
}

.section-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-card h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  color: #666;
  margin: 0 0 1.5rem 0;
  font-size: 0.95rem;
}

.btn-upload {
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 500;
}

/* ============================================================================
   DRAG AND DROP
   ============================================================================ */

.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 123, 255, 0.95);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  animation: fadeIn 0.2s ease;
}

.drag-overlay-content {
  text-align: center;
  color: white;
}

.drag-overlay-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  animation: bounce 0.5s infinite;
}

.drag-overlay-content p {
  font-size: 1.5rem;
  font-weight: 500;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.drag-drop-area {
  border: 3px dashed #ccc;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  margin-bottom: 1.5rem;
}

.drag-drop-area:hover {
  border-color: #007bff;
  background: #f0f8ff;
}

.drag-drop-area.dragging {
  border-color: #007bff;
  background: #e3f2fd;
  transform: scale(1.02);
}

.drag-drop-area.has-file {
  border-color: #28a745;
  background: #f0fff4;
}

.drag-drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.drag-drop-icon {
  color: #999;
  transition: color 0.3s;
}

.drag-drop-area:hover .drag-drop-icon,
.drag-drop-area.dragging .drag-drop-icon {
  color: #007bff;
}

.drag-drop-text {
  font-size: 1.1rem;
  color: #666;
  margin: 0;
}

.file-info {
  font-size: 0.9rem;
  color: #28a745;
  font-weight: 500;
  margin: 0;
}

/* ============================================================================
   SEARCH & FILTER
   ============================================================================ */

.search-filter-bar {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-box {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.search-box input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
}

.search-box input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.btn-search {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-search:hover {
  background: #0056b3;
}

.btn-filter {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s;
}

.btn-filter:hover {
  background: #f0f0f0;
  border-color: #007bff;
  color: #007bff;
}

.filter-panel {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.filter-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
}

.filter-group input,
.filter-group select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
}

.filter-group input:focus,
.filter-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.filter-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

/* ============================================================================
   REPORTS TABLE
   ============================================================================ */

.reports-table-container {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
}

.reports-table thead {
  background: #f8f9fa;
  border-bottom: 2px solid #e0e0e0;
}

.reports-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.reports-table th:hover {
  background: #e9ecef;
}

.reports-table tbody tr {
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.2s;
}

.reports-table tbody tr:hover {
  background: #f8f9fa;
}

.reports-table td {
  padding: 1rem;
  color: #555;
  font-size: 0.95rem;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-sm {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-view {
  background: #007bff;
  color: white;
}

.btn-view:hover {
  background: #0056b3;
}

.btn-share {
  background: #28a745;
  color: white;
}

.btn-share:hover {
  background: #218838;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:hover {
  background: #c82333;
}

/* ============================================================================
   NO DATA STATE
   ============================================================================ */

.no-data {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.no-data p {
  font-size: 1.1rem;
  color: #666;
  margin: 0 0 0.5rem 0;
}

.no-data-subtitle {
  font-size: 0.95rem;
  color: #999;
}

/* ============================================================================
   MODALS
   ============================================================================ */

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 2rem;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: #333;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

/* ============================================================================
   FORM GROUPS
   ============================================================================ */

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
  font-size: 0.95rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

/* ============================================================================
   SHARE OPTIONS
   ============================================================================ */

.share-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 0.5rem;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.share-option:hover {
  border-color: #007bff;
  background: #f0f8ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.share-option.active {
  border-color: #007bff;
  background: #e3f2fd;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.option-icon {
  font-size: 2rem;
}

/* ============================================================================
   BUTTONS
   ============================================================================ */

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

/* ============================================================================
   RESPONSIVE DESIGN
   ============================================================================ */

@media (max-width: 1200px) {
  .filter-row {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .share-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .health-report-container {
    padding: 1rem;
  }

  .health-report-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .filter-row {
    grid-template-columns: 1fr;
  }

  .search-box {
    flex-direction: column;
  }

  .reports-table-container {
    overflow-x: auto;
  }

  .reports-table {
    min-width: 600px;
  }

  .actions-cell {
    flex-direction: column;
  }
}
`

// Create and inject style element
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}

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
            {alert.type === 'error' ? '⚠️' : 'ℹ️'}
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
        <div className="drag-drop-icon">📄</div>
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
  onSubmit
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
  onShareFormSubmit
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
          <div className="form-group">
            <label>Select Sharing Option *</label>
            <div className="share-options">
              <button
                className={`share-option ${shareForm.shareOption === 'caregiver' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'caregiver')}
              >
                <span className="option-icon">👨‍⚕️</span>
                <span>Share with Caregiver</span>
              </button>
              
              <button
                className={`share-option ${shareForm.shareOption === 'family' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'family')}
              >
                <span className="option-icon">👨‍👩‍👧</span>
                <span>Share with Family Member</span>
              </button>
              
              <button
                className={`share-option ${shareForm.shareOption === 'healthcare' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'healthcare')}
              >
                <span className="option-icon">🏥</span>
                <span>Share with Healthcare Provider</span>
              </button>
              
              <button
                className={`share-option ${shareForm.shareOption === 'link' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'link')}
              >
                <span className="option-icon">🔗</span>
                <span>Generate Share Link</span>
              </button>
              
              <button
                className={`share-option ${shareForm.shareOption === 'download' ? 'active' : ''}`}
                onClick={() => onShareFormChange('shareOption', 'download')}
              >
                <span className="option-icon">⬇️</span>
                <span>Download as PDF</span>
              </button>
            </div>
          </div>

          {(shareForm.shareOption === 'caregiver' || shareForm.shareOption === 'family' || shareForm.shareOption === 'healthcare') && (
            <>
              <div className="form-group">
                <label htmlFor="shareEmail">Email Address *</label>
                <input
                  type="email"
                  id="shareEmail"
                  value={shareForm.shareEmail}
                  onChange={(e) => onShareFormChange('shareEmail', e.target.value)}
                  placeholder="Enter email address"
                />
                {errors.shareEmail && <span className="error-text">{errors.shareEmail}</span>}
              </div>

              {shareForm.shareOption === 'link' && (
                <div className="form-group">
                  <label htmlFor="expiryDate">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    id="expiryDate"
                    value={shareForm.expiryDate}
                    onChange={(e) => onShareFormChange('expiryDate', e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={onShareFormSubmit}>Share</button>
        </div>
      </div>
    </div>
  )
}

// Search and Filter Bar Component
function SearchFilterBar({
  searchKey,
  filters,
  showFilters,
  onSearchChange,
  onSearch,
  onFilterChange,
  onFilter,
  onSetShowFilters
}) {
  return (
    <div className="search-filter-container">
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search health reports..."
          value={searchKey}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
        
        <button className="btn-search" onClick={onSearch}>
          🔍 Search
        </button>
      </div>

      <button 
        className="btn-filter" 
        onClick={() => onSetShowFilters(!showFilters)}
      >
        🔽 {showFilters ? 'Hide' : 'Show'} Filters
      </button>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Report Type</label>
              <select
                value={filters.reportType}
                onChange={(e) => onFilterChange({ ...filters, reportType: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="Medical Report">Medical Report</option>
                <option value="Lab Test">Lab Test</option>
                <option value="Prescription">Prescription</option>
                <option value="Vaccination Record">Vaccination Record</option>
                <option value="Doctor's Visit Summary">Doctor's Visit Summary</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="filter-row">
            <button 
              className="btn btn-primary" 
              onClick={onFilter}
            >
              Apply Filters
            </button>

            <button 
              className="btn btn-secondary" 
              onClick={() => {
                onFilterChange({
                  reportType: '',
                  startDate: '',
                  endDate: ''
                })
                onFilter()
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Reports Table Component
function ReportsTable({
  reports,
  sortBy,
  sortOrder,
  onSort,
  onDownload,
  onShareClick,
  onDelete
}) {
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="reports-table-container">
      <table className="reports-table">
        <thead>
          <tr>
            <th onClick={() => onSort('report_type')}>
              Type {getSortIcon('report_type')}
            </th>
            <th onClick={() => onSort('report_date')}>
              Date {getSortIcon('report_date')}
            </th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reports && reports.length > 0 ? (
            reports.map((report) => (
              <tr key={report.id}>
                <td>{report.report_type}</td>
                <td>{formatDate(report.report_date)}</td>
                <td>{report.notes || '-'}</td>
                <td className="actions-cell">
                  <button 
                    className="action-btn download-btn" 
                    onClick={() => onDownload(report.id)} 
                    title="Download"
                  >
                    ↓
                  </button>
                  <button 
                    className="action-btn share-btn" 
                    onClick={() => onShareClick(report.id)} 
                    title="Share"
                  >
                    ↗
                  </button>
                  <button 
                    className="action-btn delete-btn" 
                    onClick={() => onDelete(report.id)} 
                    title="Delete"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="no-data">No health reports found</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ============================================================================
// ADMIN VIEW COMPONENT
// ============================================================================

function AdminHealthReportDashboardView({
  // State
  isLoading,
  statistics,
  reports,
  selectedReport,
  alerts,
  error,
  successMessage,
  searchKey,
  filters,
  sortBy,
  sortOrder,
  activeTab,

  // Handlers
  onSearchChange,
  onFilterChange,
  onSort,
  onReportSelect,
  onReviewClick,
  onUpdateClick,
  onGenerateReport,
  onViewReport,
  onShareReport,
  onArchiveReport,
  onTabChange
}) {
  // Loading state
  if (isLoading) {
    return (
      <div className="admin-dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading health reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-dashboard-container">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="alert alert-success">
          <span>✓</span> {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Heading */}
        <div className="section-heading">
          <h1>Health Report Dashboard</h1>
        </div>

        {/* Statistics Cards */}
        <div className="statistics-cards">
          <div className="stat-card">
            <div className="stat-label">Pending Reports</div>
            <div className="stat-value">{statistics?.pending || 0}</div>
            <div className="stat-sublabel">Awaiting review</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Approved</div>
            <div className="stat-value">{statistics?.approved || 0}</div>
            <div className="stat-sublabel">Active health records</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Flagged</div>
            <div className="stat-value">{statistics?.flagged || 0}</div>
            <div className="stat-sublabel">Requires attention</div>
          </div>

          <div className="stat-card stat-card-small">
            <div className="stat-label">Reports Generated</div>
            <div className="stat-value">{statistics?.generated || 0}</div>
            <div className="stat-sublabel">This month</div>
          </div>
        </div>

        {/* Records Management Section */}
        <div className="records-management">
          {/* Records Table */}
          <div className="records-table-container">
            <div className="table-heading">
              <h3>Records</h3>
            </div>

            {/* Search and Filters */}
            <div className="search-filter-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search applicants, reports, IDs"
                value={searchKey}
                onChange={(e) => onSearchChange(e.target.value)}
              />

              <div className="filter-group">
                <span className="filter-label">Filter field:</span>
                <select
                  className="filter-select"
                  value={filters.field || 'status'}
                  onChange={(e) => onFilterChange('field', e.target.value)}
                >
                  <option value="status">Status</option>
                  <option value="reportType">Report Type</option>
                  <option value="date">Date</option>
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Value:</span>
                <select
                  className="filter-select"
                  value={filters.value || 'pending'}
                  onChange={(e) => onFilterChange('value', e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              <div className="filter-group">
                <span className="filter-label">Sort:</span>
                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => onSort(e.target.value)}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="name">Name</option>
                </select>
              </div>
            </div>

            {/* Record Type Tabs */}
            <div className="record-tabs">
              <button
                className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => onTabChange('reports')}
              >
                Health Reports
              </button>
              <button
                className={`tab-button ${activeTab === 'patients' ? 'active' : ''}`}
                onClick={() => onTabChange('patients')}
              >
                Patients
              </button>
              <div className="tab-info">
                Use filters to refine by status, dates, report type and more.
              </div>
            </div>

            {/* Table Headers */}
            <div className="table-header">
              <div className="table-col">Applicant</div>
              <div className="table-col">Report Type</div>
              <div className="table-col">Submitted</div>
              <div className="table-col">Status</div>
              <div className="table-col">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="table-body">
              {reports && reports.length > 0 ? (
                reports.map((report) => (
                  <div
                    key={report.id}
                    className={`table-row ${selectedReport?.id === report.id ? 'selected' : ''}`}
                    onClick={() => onReportSelect(report)}
                  >
                    <div className="table-col">
                      <span className="applicant-name">{report.applicantName || 'N/A'}</span>
                    </div>
                    <div className="table-col">
                      <span className="report-type">{report.reportType || 'General'}</span>
                    </div>
                    <div className="table-col">
                      <span className="date">{report.submittedDate || 'N/A'}</span>
                    </div>
                    <div className="table-col">
                      <span className={`status-badge status-${report.status?.toLowerCase() || 'pending'}`}>
                        {report.status || 'Pending'}
                      </span>
                    </div>
                    <div className="table-col actions-col">
                      <button
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onReviewClick(report)
                        }}
                      >
                        Review
                      </button>
                      <button
                        className="action-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateClick(report)
                        }}
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No health reports found</p>
                </div>
              )}
            </div>
          </div>

          {/* Report Details Card */}
          <div className="report-details-card">
            <div className="details-heading">
              <h3>Report Details</h3>
            </div>

            <div className="details-tabs">
              <button className="details-tab active">Overview</button>
              <button className="details-tab">Documents</button>
              <button className="details-tab">History</button>
            </div>

            {selectedReport ? (
              <>
                {/* Applicant and Report Info */}
                <div className="info-section">
                  <div className="info-group">
                    <div className="info-item">
                      <div className="info-label">Applicant</div>
                      <div className="info-value primary">{selectedReport.applicantName || 'N/A'}</div>
                      <div className="info-sublabel">IC: {selectedReport.applicantIC || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="info-group">
                    <div className="info-item text-right">
                      <div className="info-label">Report Type</div>
                      <div className="info-value primary">{selectedReport.reportType || 'General'}</div>
                      <div className="info-sublabel">Date: {selectedReport.reportDate || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Healthcare Provider */}
                <div className="info-section">
                  <div className="info-label">Healthcare Provider</div>
                  <div className="info-value large">{selectedReport.healthcareProvider || 'N/A'}</div>
                  <div className="info-sublabel">{selectedReport.providerAddress || 'Address not provided'}</div>
                </div>

                {/* Key Findings */}
                <div className="findings-section">
                  <ul className="findings-list">
                    <li>Report uploaded and verified</li>
                    <li>Medical history reviewed</li>
                    <li>No risk flags detected</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                <button className="btn-primary-action">Approve Report</button>

                {/* Additional Info */}
                <div className="additional-info">
                  <div className="info-row">
                    <div className="info-col">
                      <div className="info-label">Notes</div>
                      <div className="info-sublabel">{selectedReport.notes || 'No additional notes'}</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-selection">
                <p>Select a report to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Reports Section */}
        <div className="reports-section">
          <div className="reports-header">
            <h3>Reports</h3>
            <div className="filter-group">
              <span className="filter-label">Filter</span>
              <select className="filter-select">
                <option>This month</option>
                <option>Last month</option>
                <option>This year</option>
              </select>
            </div>
          </div>

          {/* Reports Table */}
          <div className="reports-table">
            <div className="reports-table-header">
              <div className="report-col">Report name</div>
              <div className="report-col">Generated on</div>
              <div className="report-col"></div>
              <div className="report-col">Actions</div>
            </div>

            <div className="reports-table-body">
              <div className="report-row">
                <div className="report-col">
                  <span className="report-name">Health Report - Nov 2025</span>
                </div>
                <div className="report-col">
                  <span className="report-date">01 Dec 2025</span>
                </div>
                <div className="report-col"></div>
                <div className="report-col actions-col">
                  <button className="action-btn-sm" onClick={() => onViewReport('report-1')}>View</button>
                  <button className="action-btn-sm" onClick={() => onShareReport('report-1')}>Share</button>
                  <button className="action-btn-sm" onClick={() => onArchiveReport('report-1')}>Archive</button>
                </div>
              </div>

              <div className="report-row">
                <div className="report-col">
                  <span className="report-name">Health Report - OCT 2025</span>
                </div>
                <div className="report-col">
                  <span className="report-date">28 Nov 2025</span>
                </div>
                <div className="report-col"></div>
                <div className="report-col actions-col">
                  <button className="action-btn-sm" onClick={() => onViewReport('report-2')}>View</button>
                  <button className="action-btn-sm" onClick={() => onShareReport('report-2')}>Share</button>
                  <button className="action-btn-sm" onClick={() => onArchiveReport('report-2')}>Archive</button>
                </div>
              </div>

              <div className="report-row">
                <div className="report-col">
                  <span className="report-name">Health Report - Sep 2025</span>
                </div>
                <div className="report-col">
                  <span className="report-date">30 Sep 2025</span>
                </div>
                <div className="report-col"></div>
                <div className="report-col actions-col">
                  <button className="action-btn-sm" onClick={() => onViewReport('report-3')}>View</button>
                  <button className="action-btn-sm" onClick={() => onShareReport('report-3')}>Share</button>
                  <button className="action-btn-sm" onClick={() => onArchiveReport('report-3')}>Archive</button>
                </div>
              </div>
            </div>
          </div>

          {/* Generate Report Footer */}
          <div className="reports-footer">
            <p className="footer-note">Store and access reports securely for audit and Compliance.</p>
            <button className="btn-generate-report" onClick={onGenerateReport}>
              Generate Health Analysis Report (PDF)
            </button>
          </div>
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
  errorMessage,
  reports,
  uploadForm,
  shareForm,
  searchKey,
  filters,
  sortBy,
  sortOrder,
  showUploadModal,
  showShareModal,
  showFilters,
  isDragging,
  errors,

  // Handlers
  onUploadClick,
  onCancelUploadModal,
  onUploadFormChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onUploadSubmit,
  onCancelShareModal,
  onShareFormChange,
  onShareFormSubmit,
  onSearchChange,
  onSearch,
  onFilterChange,
  onFilter,
  onSetShowFilters,
  onSort,
  onDownload,
  onShareClick,
  onDelete
}) {
  return (
    <div className="health-report-container">
      <div className="health-report-content">
        {/* Header Section */}
        <div className="health-report-header">
          <h2>Health Reports</h2>
          <button className="btn btn-primary" onClick={onUploadClick}>
            📁 Upload Report
          </button>
        </div>

        {/* Alerts and Messages */}
        <AlertMessage alerts={alerts} />
        {successMessage && <SuccessMessage message={successMessage} />}
        {errorMessage && <ErrorMessage error={errorMessage} />}

        {/* Search and Filter Bar */}
        <SearchFilterBar
          searchKey={searchKey}
          filters={filters}
          showFilters={showFilters}
          onSearchChange={onSearchChange}
          onSearch={onSearch}
          onFilterChange={onFilterChange}
          onFilter={onFilter}
          onSetShowFilters={onSetShowFilters}
        />

        {/* Reports Table */}
        <ReportsTable
          reports={reports}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={onSort}
          onDownload={onDownload}
          onShareClick={onShareClick}
          onDelete={onDelete}
        />
      </div>

      {/* Modals */}
      <UploadModal
        show={showUploadModal}
        uploadForm={uploadForm}
        isDragging={isDragging}
        errors={errors}
        onCancel={onCancelUploadModal}
        onUploadFormChange={onUploadFormChange}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onFileSelect={onFileSelect}
        onSubmit={onUploadSubmit}
      />

      <ShareModal
        show={showShareModal}
        shareForm={shareForm}
        errors={errors}
        onCancel={onCancelShareModal}
        onShareFormChange={onShareFormChange}
        onShareFormSubmit={onShareFormSubmit}
      />
    </div>
  )
}

export default function HealthMonitoringView({
  // User role
  userRole,

  // Admin props
  isLoading,
  statistics,
  selectedReport,
  activeTab,
  onReviewClick,
  onUpdateClick,
  onGenerateReport,
  onViewReport,
  onShareReport,
  onArchiveReport,
  onTabChange,

  // Common and user props
  alerts,
  errorMessage,
  reports,
  uploadForm,
  shareForm,
  searchKey,
  filters,
  sortBy,
  sortOrder,
  showUploadModal,
  showShareModal,
  showFilters,
  isDragging,
  errors,
  successMessage,

  // User handlers
  onUploadClick,
  onCancelUploadModal,
  onUploadFormChange,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileSelect,
  onUploadSubmit,
  onCancelShareModal,
  onShareFormChange,
  onShareFormSubmit,
  onSearchChange,
  onSearch,
  onFilter,
  onSetShowFilters,
  onSort,
  onDownload,
  onShareClick,
  onDelete,

  // Admin handlers
  onFilterChange,
  onReportSelect,
  
  // Aliases
  onAdminSort
}) {
  // Render Admin Dashboard if user is admin
  if (userRole === 'admin') {
    return (
      <AdminHealthReportDashboardView
        isLoading={isLoading}
        statistics={statistics}
        reports={reports}
        selectedReport={selectedReport}
        alerts={alerts}
        error={errorMessage}
        successMessage={successMessage}
        searchKey={searchKey}
        filters={filters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        activeTab={activeTab}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
        onSort={onAdminSort || onSort}
        onReportSelect={onReportSelect}
        onReviewClick={onReviewClick}
        onUpdateClick={onUpdateClick}
        onGenerateReport={onGenerateReport}
        onViewReport={onViewReport}
        onShareReport={onShareReport}
        onArchiveReport={onArchiveReport}
        onTabChange={onTabChange}
      />
    )
  }

  // Render User Health Monitoring View otherwise
  return (
    <UserHealthReportView
      alerts={alerts}
      successMessage={successMessage}
      errorMessage={errorMessage}
      reports={reports}
      uploadForm={uploadForm}
      shareForm={shareForm}
      searchKey={searchKey}
      filters={filters}
      sortBy={sortBy}
      sortOrder={sortOrder}
      showUploadModal={showUploadModal}
      showShareModal={showShareModal}
      showFilters={showFilters}
      isDragging={isDragging}
      errors={errors}
      onUploadClick={onUploadClick}
      onCancelUploadModal={onCancelUploadModal}
      onUploadFormChange={onUploadFormChange}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onFileSelect={onFileSelect}
      onUploadSubmit={onUploadSubmit}
      onCancelShareModal={onCancelShareModal}
      onShareFormChange={onShareFormChange}
      onShareFormSubmit={onShareFormSubmit}
      onSearchChange={onSearchChange}
      onSearch={onSearch}
      onFilterChange={onFilter}
      onFilter={onFilter}
      onSetShowFilters={onSetShowFilters}
      onSort={onSort}
      onDownload={onDownload}
      onShareClick={onShareClick}
      onDelete={onDelete}
    />
  )
}
