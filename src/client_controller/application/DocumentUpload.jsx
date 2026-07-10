import React, { useRef, useState } from 'react'
import './DocumentUpload.css'

const DocumentUpload = ({
  label,
  required = false,
  documentData,
  onUpload,
  onDelete,
  uploading = false,
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  hint = "PDF, JPG, PNG, WEBP (Max 10MB)",
  error = null
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)
  const fileInputRef = useRef(null)

  const isDisabled = () => uploading || !!fileInputRef.current?.matches(':disabled')

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isDisabled()) return
    dragCounter.current += 1
    setIsDragging(true)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isDisabled()) return
    dragCounter.current -= 1
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    if (isDisabled()) return

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Forward every dropped file to the same validated upload path used by
    // the file picker (fileUploadService checks the real MIME type, not just
    // the extension) so unsupported formats get a proper error instead of
    // being silently dropped here.
    onUpload({ target: { files: [file] } })
  }

  return (
    <div className="document-upload-field">
      <label className="document-label">
        {label}
        {required && <span className="required-star">*</span>}
      </label>

      {!documentData?.url ? (
        <div
          className={`upload-area ${isDragging ? 'drag-active' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            id={`upload-${label.replace(/\s+/g, '-')}`}
            className="file-input-hidden"
            accept={accept}
            onChange={onUpload}
            disabled={uploading}
          />
          <label
            htmlFor={`upload-${label.replace(/\s+/g, '-')}`}
            className={`upload-button ${uploading ? 'uploading' : ''}`}
          >
            {uploading ? (
              <>
                <span className="spinner"></span>
                Uploading...
              </>
            ) : (
              <>
                <span className="upload-icon">📤</span>
                Choose File
              </>
            )}
          </label>
          <p className="upload-hint">
            {isDragging ? 'Drop file to upload' : `Drag & drop a file here, or ${hint}`}
          </p>
        </div>
      ) : (
        <div className="uploaded-file-container">
          <div className="file-info">
            <span className="file-icon">📄</span>
            <div className="file-details">
              <span className="file-name">{documentData.fileName}</span>
              <span className="file-date">
                Uploaded: {new Date(documentData.uploadedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="file-actions">
            <a 
              href={documentData.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="file-action-btn view-btn"
            >
              👁️ View
            </a>
            <button
              type="button"
              onClick={onDelete}
              className="file-action-btn delete-btn"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}
      {error && <span className="error-message" style={{color: '#A8202D', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block'}}>{error}</span>}
    </div>
  )
}

export default DocumentUpload
