import React from 'react'
import './DocumentUpload.css'

const DocumentUpload = ({ 
  label, 
  required = false,
  documentData,
  onUpload,
  onDelete,
  uploading = false,
  accept = ".pdf",
  hint = "PDF only (Max 10MB)"
}) => {
  return (
    <div className="document-upload-field">
      <label className="document-label">
        {label}
        {required && <span className="required-star">*</span>}
      </label>
      
      {!documentData?.url ? (
        <div className="upload-area">
          <input
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
          <p className="upload-hint">{hint}</p>
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
    </div>
  )
}

export default DocumentUpload
