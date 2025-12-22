import './PDFViewer.css'

export default function PDFViewer({ fileUrl, fileName, onClose }) {
  return (
    <div className="pdf-viewer-overlay" onClick={onClose}>
      <div className="pdf-viewer-container" onClick={(e) => e.stopPropagation()}>
        {/* Header with document name and close button */}
        <div className="pdf-viewer-header">
          <h3 className="pdf-document-name">{fileName || 'Health Report'}</h3>
          <button className="pdf-close-btn" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        {/* PDF Display Area */}
        <div className="pdf-viewer-content">
          <iframe
            src={fileUrl}
            className="pdf-iframe"
            title={fileName || 'PDF Document'}
          />
        </div>
      </div>
    </div>
  )
}
