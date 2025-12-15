// HealthReport View - Pure Presentational Component
// Receives all props from HealthReportController
// NO business logic - only UI rendering

import { useRef } from 'react'
import '../components/application/maintainApplication.css'

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
// MAIN HEALTH REPORT VIEW COMPONENT
// ============================================================================

export default function HealthReportView({
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
