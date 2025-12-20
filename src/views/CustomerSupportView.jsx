// src/views/CustomerSupportView.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import '../components/customerSupport/CustomerSupport.css'
import PDFViewer from '../components/common/PDFViewer'

// ============================================================================
// HELPER COMPONENTS (All inline - no separate files)
// ============================================================================

// Nominee Detail Modal Component
function NomineeDetailModal({ nominees, inquiry, onClose }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: '2-digit' 
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '900px'}}>
        <div className="inquiry-card">
          <div className="inquiry-header">
            <h2>Nominee Details - {inquiry?.user?.full_name || 'Elder'}</h2>
          </div>

          {(!nominees || nominees.length === 0) ? (
            <div style={{padding: '24px', textAlign: 'center', color: '#6b7280'}}>
              <p>No nominees found for this user</p>
            </div>
          ) : (
            nominees.map((nominee, index) => (
            <div key={nominee.id} style={{marginBottom: '24px'}}>
              <h3 style={{
                fontSize: '18px', 
                fontWeight: 600, 
                marginBottom: '16px',
                paddingBottom: '8px',
                borderBottom: '2px solid #e5e7eb'
              }}>
                {nominee.type === 'nominee1' ? 'Nominee 1' : 'Nominee 2'}
              </h3>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                <div className="detail-field">
                  <label>Full Name</label>
                  <p>{nominee.name || 'N/A'}</p>
                </div>
                <div className="detail-field">
                  <label>IC Number</label>
                  <p>{nominee.ic_number || 'N/A'}</p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                <div className="detail-field">
                  <label>Date of Birth</label>
                  <p>{formatDate(nominee.dob)}</p>
                </div>
                <div className="detail-field">
                  <label>Relationship</label>
                  <p>{nominee.relationship || 'N/A'}</p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                <div className="detail-field">
                  <label>Email</label>
                  <p>{nominee.email || 'N/A'}</p>
                </div>
                <div className="detail-field">
                  <label>Residence Phone</label>
                  <p>{nominee.residence_phone || 'N/A'}</p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                <div className="detail-field">
                  <label>Telephone</label>
                  <p>{nominee.telephone || 'N/A'}</p>
                </div>
                <div className="detail-field">
                  <label>Sex</label>
                  <p>{nominee.sex || 'N/A'}</p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                <div className="detail-field">
                  <label>Race</label>
                  <p>{nominee.race || 'N/A'}</p>
                </div>
                <div className="detail-field">
                  <label>Marital Status</label>
                  <p>{nominee.marital_status || 'N/A'}</p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '16px'}}>
                <div className="detail-field">
                  <label>Address</label>
                  <p>{nominee.address || 'N/A'} {nominee.postcode ? `(${nominee.postcode})` : ''}</p>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr', gap: '16px'}}>
                <div className="detail-field">
                  <label>Malaysian Citizen</label>
                  <p>{nominee.is_malaysian ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          ))
          )}

          <div className="modal-actions" style={{marginTop: '24px'}}>
            <button className="btn-secondary" onClick={onClose}>
              <span>←</span> Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Flag Application Modal Component
function FlagApplicationModal({ onClose, onFlag }) {
  const [reason, setReason] = useState('')
  const [flaggedCode, setFlaggedCode] = useState('')
  const [isFlagging, setIsFlagging] = useState(false)

  const handleFlag = async () => {
    if (!reason.trim() || !flaggedCode || isFlagging) return
    
    setIsFlagging(true)
    const result = await onFlag(reason, flaggedCode)
    
    if (result?.success) {
      setReason('')
      setFlaggedCode('')
      onClose()
    } else {
      alert('Failed to flag application: ' + (result?.error || 'Unknown error'))
    }
    setIsFlagging(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '600px'}}>
        <div className="inquiry-card">
          <div className="inquiry-header">
            <h2>Flag Application for Admin Review</h2>
          </div>

          <div className="inquiry-details">
            <div className="detail-field" style={{marginBottom: '16px'}}>
              <label>Select affected nominee</label>
              <p style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px'}}>
                Choose which nominee requires admin attention
              </p>
              <select
                className="filter-select"
                value={flaggedCode}
                onChange={(e) => setFlaggedCode(e.target.value)}
                disabled={isFlagging}
                style={{width: '100%', padding: '12px', fontSize: '0.875rem'}}
              >
                <option value="">Select...</option>
                <option value="nominee1_inactive">Nominee 1</option>
                <option value="nominee2_inactive">Nominee 2</option>
                <option value="both_nominees_inactive">Both</option>
              </select>
            </div>

            <div className="detail-field">
              <label>Reason for Flagging</label>
              <p style={{fontSize: '0.875rem', color: '#6b7280', marginBottom: '8px'}}>
                Explain why this application needs admin attention (e.g., "Nominee 1 deceased - needs removal and replacement")
              </p>
              <textarea
                className="reply-textarea"
                placeholder="Enter detailed reason for flagging..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isFlagging}
                rows={4}
                style={{width: '100%', padding: '12px', fontSize: '0.875rem'}}
              />
            </div>
          </div>

          <div className="modal-actions" style={{marginTop: '24px'}}>
            <button className="btn-secondary" onClick={onClose} disabled={isFlagging}>
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleFlag}
              disabled={isFlagging || !reason.trim() || !flaggedCode}
              style={{backgroundColor: '#dc2626'}}
            >
              {isFlagging ? 'Flagging...' : 'Flag Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Inquiry Detail Modal Component
function InquiryDetailModal({ inquiry, conversations, onClose, onSendReply, onSaveDraft, onMarkResolved, nominees, activeTab, onFlag }) {
  const [replyMessage, setReplyMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  if (!inquiry) return null

  // Format status for display (in_progress → In Progress)
  const formatStatus = (status) => {
    if (!status) return 'Open'
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Get status color class
  const getStatusColor = (status) => {
    if (!status || status === 'open' || status === 'pending') return 'status-open'
    if (status === 'in_progress') return 'status-in-progress'
    if (status === 'resolved') return 'status-resolved'
    return 'status-open'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
    return `${day} ${month} ${year}, ${time}`
  }

  const handleSend = async () => {
    if (!replyMessage.trim() || isSending) return
    
    setIsSending(true)
    const result = await onSendReply(replyMessage)
    
    if (result?.success) {
      setReplyMessage('')
      // Modal stays open for multi-turn conversations
    }
    setIsSending(false)
  }

  const handleSaveDraft = () => {
    if (onSaveDraft && replyMessage.trim()) {
      onSaveDraft(replyMessage)
    }
  }

  const handleMarkResolved = async () => {
    if (onMarkResolved) {
      await onMarkResolved(inquiry.id)
      onClose()
    }
  }

  const insertTemplate = (template) => {
    const templates = {
      'critical_deadline': 'This is a critical deadline reminder. Please submit your documents by the specified date.',
      'incorrect_document': 'The document you submitted appears to be incorrect or incomplete. Please verify the format and resubmit.',
      'reminder_needed': 'This is a gentle reminder regarding your pending application. Please take the necessary action.'
    }
    setReplyMessage(templates[template] || '')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Inquiry Card */}
        <div className="inquiry-card">
          {/* Header */}
          <div className="inquiry-header">
            <h2>Inquiry from {inquiry.user?.full_name || inquiry.elder?.full_name || 'Unknown'}</h2>
            <div className={`inquiry-status-badge ${getStatusColor(inquiry.status)}`}>
              {formatStatus(inquiry.status)}
            </div>
          </div>

          {/* User Contact Info */}
          <div className="inquiry-details" style={{marginBottom: '16px'}}>
            <div className="detail-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px'}}>
              <div className="detail-field">
                <label>Email</label>
                <p>{inquiry.user?.email || inquiry.elder?.email || 'N/A'}</p>
              </div>
              <div className="detail-field">
                <label>Phone</label>
                <p>{inquiry.user?.phone || inquiry.elder?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Inquiry Details */}
          <div className="inquiry-details">
            {/* Flagged Health Report Details */}
            {inquiry.type === 'flagged_report' ? (
              <>
                {/* Report Title */}
                <div className="detail-field">
                  <label>Report Title</label>
                  <p className="subject-title">{inquiry.report_title || 'Health Report'}</p>
                </div>

                {/* Report Date and Type */}
                <div className="detail-row" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'}}>
                  <div className="detail-field">
                    <label>Report Date</label>
                    <p>{inquiry.report_date ? new Date(inquiry.report_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A'}</p>
                  </div>
                  <div className="detail-field">
                    <label>Report Type</label>
                    <p>{inquiry.report_type || 'N/A'}</p>
                  </div>
                </div>

                {/* Provider Name */}
                <div className="detail-field">
                  <label>Provider Name</label>
                  <p>{inquiry.provider_name || 'N/A'}</p>
                </div>

                {/* Submission Notes */}
                {inquiry.notes && (
                  <div className="detail-field">
                    <label>Submission Notes</label>
                    <p className="context-text">{inquiry.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Subject */}
                <div className="detail-field">
                  <label>Subject</label>
                  <p className="subject-title">{inquiry.subject || 'No subject'}</p>
                </div>

                {/* Date and Contact Row */}
                <div className="detail-row">
                  <div className="detail-field">
                    <label>Received</label>
                    <p>{formatDate(inquiry.created_at)}</p>
                  </div>
                </div>

                {/* Context/Message */}
                <div className="detail-field">
                  <label>Context</label>
                  <p className="context-text">{inquiry.message}</p>
                </div>
              </>
            )}

            {/* Current Nominees (for Nominee tab only) */}
            {activeTab === 'nominees' && nominees && nominees.length > 0 && (
              <div className="detail-field" style={{marginTop: '16px'}}>
                <label>Current Nominees</label>
                <div style={{background: '#f9fafb', padding: '12px', borderRadius: '8px', marginTop: '8px'}}>
                  {nominees.map((nominee, index) => (
                    <div key={nominee.id} style={{
                      padding: '10px',
                      background: 'white',
                      borderRadius: '6px',
                      marginBottom: index < nominees.length - 1 ? '8px' : 0,
                      border: '1px solid #e5e7eb',
                      fontSize: '0.875rem'
                    }}>
                      <p style={{fontWeight: 600, marginBottom: '4px'}}>
                        {nominee.name} <span style={{color: '#6b7280', fontWeight: 400}}>({nominee.type === 'nominee1' ? 'Nominee 1' : 'Nominee 2'})</span>
                      </p>
                      <p style={{fontSize: '0.75rem', color: '#6b7280'}}>
                        {nominee.relationship || 'N/A'} • IC: {nominee.ic_number || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="separator"></div>

          {/* Conversation */}
          <div className="conversation-section">
            <h3>Conversation</h3>
            <div className="conversation-messages">
              {/* Original message from elder - only show for inquiries, not flagged reports */}
              {inquiry.type !== 'flagged_report' && inquiry.message && (
                <div className="message elder-message">
                  <div className="message-header">Elder</div>
                  <div className="message-body">{inquiry.message}</div>
                  <div className="message-meta">{formatDate(inquiry.created_at)}</div>
                </div>
              )}

              {/* System alerts or replies */}
              {conversations.map((conv) => (
                <div key={conv.id} className={`message ${conv.sender_type === 'elder' ? 'elder-message' : 'support-message'}`}>
                  <div className="message-header">
                    {conv.sender?.full_name || (conv.sender_type === 'elder' ? 'Elder' : 'Support')}
                  </div>
                  <div className="message-body">{conv.message}</div>
                  <div className="message-meta">{formatDate(conv.created_at)}</div>
                </div>
              ))}

              {/* Draft message preview */}
              {replyMessage && (
                <div className="message draft-message">
                  <div className="message-header">You (draft)</div>
                  <div className="message-body">{replyMessage}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reply Section - Hide if resolved */}
        {inquiry.status === 'resolved' ? (
          <div className="reply-section" style={{padding: '1.5rem'}}>
            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <p style={{color: '#166534', margin: 0, fontWeight: 500}}>
                ✓ This inquiry has been resolved and is now closed.
              </p>
            </div>
          </div>
        ) : (
          <div className="reply-section">
            <div className="reply-input-area">
              <div className="reply-label-row">
                <div>
                  <label>Reply to elder</label>
                  <p className="reply-hint">Type your reply here or adjust the drafted message above before sending...</p>
                </div>
              </div>
              
              <textarea
                className="modal-reply-textarea"
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                disabled={isSending}
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="modal-actions">
          <div className="modal-actions-left">
            <button className="btn-secondary" onClick={onClose}>
              <span>←</span> Back
            </button>
            {inquiry.status !== 'resolved' && (
              activeTab === 'nominees' ? (
                <button 
                  className="btn-resolve"
                  onClick={onFlag}
                  style={{backgroundColor: '#dc2626'}}
                >
                  Flag Application
                </button>
              ) : (
                <button 
                  className="btn-resolve"
                  onClick={handleMarkResolved}
                >
                  Mark as Resolved
                </button>
              )
            )}
          </div>
          <div className="modal-actions-right">
            {/* View Document button for flagged reports */}
            {inquiry.type === 'flagged_report' && inquiry.report_file_url && (
              <button
                className="btn-secondary"
                onClick={() => {
                  const event = new CustomEvent('openPDFViewer', {
                    detail: {
                      fileUrl: inquiry.report_file_url,
                      fileName: inquiry.report_title || 'Health Report'
                    }
                  })
                  window.dispatchEvent(event)
                }}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  borderColor: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>📄</span>
                View Document
              </button>
            )}
            {inquiry.status !== 'resolved' && (
              <button 
                className="btn-primary"
                onClick={handleSend}
                disabled={isSending || !replyMessage.trim()}
              >
                {isSending ? 'Sending...' : 'Send reply'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN VIEW COMPONENT
// ============================================================================

export default function CustomerSupportView({
  activeTab,
  onTabChange,
  data,
  selectedItem,
  selectedNominees,
  onSelectItem,
  conversations,
  onSendReply,
  onUpdateStatus,
  onFlagApplication,
  loading,
  searchTerm,
  onSearch,
  filterField,
  filterValue,
  onFilterFieldChange,
  onFilterValueChange,
  sortBy,
  onSortChange,
  contactEmail,
  contactPhone,
  onContactEmailChange,
  onContactPhoneChange,
  onSaveContactSettings,
  contactLoading,
  contactError,
  contactSuccess
}) {
  const [replyMessage, setReplyMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showNomineeModal, setShowNomineeModal] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfFileName, setPdfFileName] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const navigate = useNavigate()

  // Listen for PDF viewer events from modal
  useEffect(() => {
    const handleOpenPDFViewer = (event) => {
      const { fileUrl, fileName } = event.detail
      handleViewDocument(fileUrl, fileName)
    }

    window.addEventListener('openPDFViewer', handleOpenPDFViewer)
    return () => {
      window.removeEventListener('openPDFViewer', handleOpenPDFViewer)
    }
  }, [])

  // Format status for display (in_progress → In Progress)
  const formatStatus = (status) => {
    if (!status) return 'Open'
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Get status color class
  const getStatusColor = (status) => {
    if (!status || status === 'open' || status === 'pending') return 'status-open'
    if (status === 'in_progress') return 'status-in-progress'
    if (status === 'resolved') return 'status-resolved'
    return 'status-open'
  }

  // 处理发送回复
  const handleSendClick = async (contactType = 'reply') => {
    if (!replyMessage.trim() || isSending) return

    setIsSending(true)
    const result = await onSendReply(replyMessage, contactType)
    
    if (result?.success) {
      setReplyMessage('')
    }
    setIsSending(false)
  }

  // 处理打开模态框
  const handleViewDetails = async () => {
    setShowModal(true)
  }

  // 处理关闭模态框
  const handleCloseModal = () => {
    setShowModal(false)
  }

  // Handle nominee modal
  const handleCloseNomineeModal = () => {
    setShowNomineeModal(false)
  }

  // Handle flag modal
  const handleOpenFlagModal = () => {
    setShowFlagModal(true)
  }

  const handleCloseFlagModal = () => {
    setShowFlagModal(false)
  }

  const handleFlagApplication = async (reason, flaggedCode) => {
    return await onFlagApplication(reason, flaggedCode)
  }

  // Handle PDF viewer
  const handleViewDocument = (fileUrl, fileName) => {
    setPdfUrl(fileUrl)
    setPdfFileName(fileName)
    setShowPDFViewer(true)
  }

  const handleClosePDFViewer = () => {
    setShowPDFViewer(false)
    setPdfUrl('')
    setPdfFileName('')
  }

  // Handle internal note auto-save
  const handleInternalNoteBlur = async () => {
    if (!selectedItem || internalNote === selectedItem.internal_note) return
    
    // Auto-save the internal note
    try {
      const result = await onUpdateStatus(selectedItem.id, selectedItem.status, internalNote)
      if (!result?.success) {
        console.error('Failed to save internal note')
        // Optionally revert to original value
        setInternalNote(selectedItem.internal_note || '')
      }
    } catch (error) {
      console.error('Error saving internal note:', error)
    }
  }

  // Update internal note when selected item changes
  React.useEffect(() => {
    if (selectedItem) {
      setInternalNote(selectedItem.internal_note || '')
    } else {
      setInternalNote('')
    }
  }, [selectedItem])

  // 处理跳转到更新页面
  const handleNavigateToUpdate = () => {
    navigate('/support/updateContact')
  }

  // 快速回复模板
  const insertTemplate = (template) => {
    const templates = {
      'critical_deadline': 'This is a critical deadline reminder. Please submit your documents by the specified date.',
      'incorrect_document': 'The document you submitted appears to be incorrect or incomplete. Please verify the format and resubmit.',
      'reminder_needed': 'This is a gentle reminder regarding your pending application. Please take the necessary action.'
    }
    setReplyMessage(templates[template] || '')
  }

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = date.toLocaleString('en-US', { month: 'short' })
    const year = date.getFullYear()
    const time = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
    return `${day} ${month} ${year}, ${time}`
  }

  // 渲染列表项
  const renderListItem = (item) => {
    const isSelected = selectedItem?.id === item.id

    if (activeTab === 'inquiries') {
      return (
        <div 
          key={item.id}
          className={`support-list-item ${isSelected ? 'active' : ''}`}
          onClick={() => onSelectItem(item)}
        >
          <div className="item-header">
            <span className="item-name">{item.user?.full_name || item.elder?.full_name || 'Unknown User'}</span>
            <span className="item-subject">{item.displayText || item.message || item.subject}</span>
            <span className="item-date">{formatDate(item.created_at)}</span>
          </div>
        </div>
      )
    }

    if (activeTab === 'nominees') {
      return (
        <div 
          key={item.id}
          className={`support-list-item ${isSelected ? 'active' : ''}`}
          onClick={() => onSelectItem(item)}
        >
          <div className="item-header">
            <span className="item-name">{item.user?.full_name || 'Unknown User'}</span>
            <span className="item-subject">{item.message || item.subject}</span>
            <span className="item-date">{formatDate(item.created_at)}</span>
          </div>
        </div>
      )
    }

    if (activeTab === 'healthReports') {
      return (
        <div 
          key={item.id}
          className={`support-list-item ${isSelected ? 'active' : ''}`}
          onClick={() => onSelectItem(item)}
        >
          <div className="item-header">
            <span className="item-name">{item.user?.full_name || 'Unknown User'}</span>
            <span className="item-subject">{item.displayText || item.message || item.subject || item.report_title}</span>
            <span className="item-date">{formatDate(item.created_at || item.report_date)}</span>
          </div>
        </div>
      )
    }
  }

  // 渲染详情面板
  const renderDetailPanel = () => {
    if (!selectedItem) {
      return (
        <div className="detail-empty">
          <p>Select an item to view details</p>
        </div>
      )
    }

    if (activeTab === 'inquiries') {
      return (
        <div className="detail-content">
          <div className="detail-header">
            <h3>Inquiry details</h3>
            <div className="detail-meta">
              <span>{selectedItem.user?.full_name || selectedItem.elder?.full_name || 'Unknown'} • {formatDate(selectedItem.created_at)}</span>
            </div>
          </div>

          <div className="detail-section">
            <p className="detail-label">STATUS</p>
            <div className={`status-badge ${getStatusColor(selectedItem.status)}`}>
              {formatStatus(selectedItem.status)}
            </div>
          </div>

          <div className="detail-section">
            <p className="detail-label">EMAIL</p>
            <p className="detail-value">{selectedItem.user?.email || selectedItem.elder?.email || 'N/A'}</p>
          </div>

          <div className="detail-section">
            <p className="detail-label">PHONE</p>
            <p className="detail-value">{selectedItem.user?.phone || selectedItem.elder?.phone || 'N/A'}</p>
          </div>

          <div className="detail-section">
            <p className="detail-label">CONTENT</p>
            <p className="detail-value">{selectedItem.message}</p>
          </div>

          <div className="detail-section">
            <p className="detail-label">INTERNAL NOTE</p>
            <textarea
              className="reply-textarea"
              placeholder="Add working notes here, e.g., Verified ID, will send checklist for correct income document..."
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              onBlur={handleInternalNoteBlur}
              rows={3}
              style={{fontSize: '0.875rem', fontStyle: internalNote ? 'normal' : 'italic'}}
            />
          </div>

          {/* 回复历史 */}
          {conversations.length > 0 && (
            <div className="detail-section">
              <p className="detail-label">REPLY HISTORY</p>
              <div className="reply-history">
                {conversations.map((conv) => (
                  <div key={conv.id} className="reply-item">
                    <p className="reply-meta">
                      {conv.sender?.full_name || (conv.sender_type === 'elder' ? 'Elder' : 'Support')} • {formatDate(conv.created_at)}
                    </p>
                    <p className="reply-message">{conv.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 回复表单 - Hide if resolved */}
          {selectedItem.status === 'resolved' ? (
            <div className="detail-section">
              <div style={{
                padding: '1rem',
                background: '#f0fdf4',
                border: '1px solid #86efac',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <p style={{color: '#166534', margin: 0, fontWeight: 500}}>
                  ✓ This inquiry has been resolved and is now closed.
                </p>
              </div>
            </div>
          ) : (
            <div className="detail-section">
              <p className="detail-label">REPLY TO ELDER</p>
              <div className="reply-form">
                <textarea
                  className="reply-textarea"
                  placeholder="Type your response to answer the inquiry..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  disabled={isSending}
                />
                <div className="reply-actions">
                  <div className="template-buttons">
                    <button 
                      className="template-btn"
                      onClick={() => insertTemplate('critical_deadline')}
                      disabled={isSending}
                    >
                      Critical deadline
                    </button>
                    <button 
                      className="template-btn"
                      onClick={() => insertTemplate('incorrect_document')}
                      disabled={isSending}
                    >
                      Incorrect document
                    </button>
                    <button 
                      className="template-btn"
                      onClick={() => insertTemplate('reminder_needed')}
                      disabled={isSending}
                    >
                      Reminder needed
                    </button>
                  </div>
                  <div className="action-buttons">
                    <button 
                      className="btn-secondary"
                      onClick={handleViewDetails}
                      disabled={!selectedItem}
                    >
                      View details
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => handleSendClick('reply')}
                      disabled={isSending || !replyMessage.trim()}
                    >
                      {isSending ? 'Sending...' : 'Send reply'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    // Nominees and Health Reports detail panel (same structure as inquiries)
    const tabLabel = activeTab === 'nominees' ? 'Nominee Inquiry' : 'Health Report'
    const replyPlaceholder = activeTab === 'nominees' 
      ? 'Type your response to answer the nominee inquiry...'
      : 'Type your response to answer the health report inquiry...'
    
    // Check if this is a flagged report (not an inquiry)
    const isFlaggedReport = selectedItem.type === 'flagged_report'

    return (
      <div className="detail-content">
        <div className="detail-header">
          <h3>{isFlaggedReport ? 'Flagged Health Report' : tabLabel}</h3>
          <div className="detail-meta">
            <span>{selectedItem.user?.full_name || selectedItem.elder?.full_name || 'Unknown User'} • {formatDate(selectedItem.created_at || selectedItem.report_date)}</span>
          </div>
        </div>

        <div className="detail-section">
          <p className="detail-label">STATUS</p>
          <div className={`status-badge ${getStatusColor(selectedItem.status || selectedItem.health_report_status)}`}>
            {formatStatus(selectedItem.status || selectedItem.health_report_status)}
          </div>
        </div>

        <div className="detail-section">
          <p className="detail-label">EMAIL</p>
          <p className="detail-value">{selectedItem.user?.email || selectedItem.elder?.email || 'N/A'}</p>
        </div>

        <div className="detail-section">
          <p className="detail-label">PHONE</p>
          <p className="detail-value">{selectedItem.user?.phone || selectedItem.elder?.phone || 'N/A'}</p>
        </div>

        {/* View Document Button - Only for flagged reports */}
        {isFlaggedReport && selectedItem.report_file_url && (
          <div className="detail-section">
            <button
              className="btn-primary"
              onClick={() => handleViewDocument(selectedItem.report_file_url, selectedItem.report_title || 'Health Report')}
              style={{
                backgroundColor: '#3b82f6',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                color: 'white',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>📄</span>
              View Document
            </button>
          </div>
        )}

        {/* Report Details - Only for flagged reports */}
        {isFlaggedReport && (
          <>
            <div className="detail-section">
              <p className="detail-label">REPORT TITLE</p>
              <p className="detail-value">{selectedItem.report_title || 'N/A'}</p>
            </div>

            <div className="detail-section">
              <p className="detail-label">REPORT DATE</p>
              <p className="detail-value">{selectedItem.report_date ? new Date(selectedItem.report_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A'}</p>
            </div>

            <div className="detail-section">
              <p className="detail-label">REPORT TYPE</p>
              <p className="detail-value">{selectedItem.report_type || 'N/A'}</p>
            </div>

            <div className="detail-section">
              <p className="detail-label">PROVIDER NAME</p>
              <p className="detail-value">{selectedItem.provider_name || 'N/A'}</p>
            </div>

            {selectedItem.notes && (
              <div className="detail-section">
                <p className="detail-label">SUBMISSION NOTES</p>
                <p className="detail-value">{selectedItem.notes}</p>
              </div>
            )}
          </>
        )}

        {/* Content - Only for inquiries */}
        {!isFlaggedReport && (
          <div className="detail-section">
            <p className="detail-label">CONTENT</p>
            <p className="detail-value">{selectedItem.message}</p>
          </div>
        )}

        {/* Current Nominees Section (Nominees tab only) */}
        {activeTab === 'nominees' && selectedNominees && selectedNominees.length > 0 && (
          <div className="detail-section">
            <p className="detail-label">CURRENT NOMINEES</p>
            <div style={{background: '#f9fafb', padding: '16px', borderRadius: '8px', marginTop: '8px'}}>
              {selectedNominees.map((nominee, index) => (
                <div key={nominee.id} style={{
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  marginBottom: index < selectedNominees.length - 1 ? '12px' : 0,
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div>
                      <p style={{fontWeight: 600, fontSize: '0.875rem', marginBottom: '4px'}}>
                        {nominee.name} <span style={{color: '#6b7280', fontWeight: 400}}>({nominee.type === 'nominee1' ? 'Nominee 1' : 'Nominee 2'})</span>
                      </p>
                      <p style={{fontSize: '0.75rem', color: '#6b7280'}}>
                        Relationship: {nominee.relationship || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <button
                className="btn-secondary"
                onClick={() => setShowNomineeModal(true)}
                style={{marginTop: '12px', width: '100%'}}
              >
                View Full Nominee Details
              </button>
            </div>
          </div>
        )}

        {activeTab === 'nominees' && selectedNominees && selectedNominees.length === 0 && (
          <div className="detail-section">
            <p className="detail-label">CURRENT NOMINEES</p>
            <p className="detail-value" style={{color: '#9ca3af', fontStyle: 'italic'}}>
              No nominees found for this user
            </p>
          </div>
        )}

        <div className="detail-section">
          <p className="detail-label">INTERNAL NOTE</p>
          <textarea
            className="reply-textarea"
            placeholder="Add working notes here, e.g., Verified ID, will send checklist for correct income document..."
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            onBlur={handleInternalNoteBlur}
            rows={3}
            style={{fontSize: '0.875rem', fontStyle: internalNote ? 'normal' : 'italic'}}
          />
        </div>

        {/* 回复历史 */}
        {conversations.length > 0 && (
          <div className="detail-section">
            <p className="detail-label">REPLY HISTORY</p>
            <div className="reply-history">
              {conversations.map((conv) => (
                <div key={conv.id} className="reply-item">
                  <p className="reply-meta">
                    {conv.sender?.full_name || (conv.sender_type === 'elder' ? 'Elder' : 'Support')} • {formatDate(conv.created_at)}
                  </p>
                  <p className="reply-message">{conv.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 回复表单 - Hide if resolved */}
        {selectedItem.status === 'resolved' ? (
          <div className="detail-section">
            <div style={{
              padding: '1rem',
              background: '#f0fdf4',
              border: '1px solid #86efac',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              <p style={{color: '#166534', margin: 0, fontWeight: 500}}>
                ✓ This inquiry has been resolved and is now closed.
              </p>
            </div>
          </div>
        ) : (
          <div className="detail-section">
            <p className="detail-label">REPLY TO ELDER</p>
            <div className="reply-form">
              <textarea
                className="reply-textarea"
                placeholder={replyPlaceholder}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                disabled={isSending}
              />
              <div className="reply-actions">
                <div className="template-buttons">
                  <button 
                    className="template-btn"
                    onClick={() => insertTemplate('critical_deadline')}
                    disabled={isSending}
                  >
                    Critical deadline
                  </button>
                  <button 
                    className="template-btn"
                    onClick={() => insertTemplate('incorrect_document')}
                    disabled={isSending}
                  >
                    Incorrect document
                  </button>
                  <button 
                    className="template-btn"
                    onClick={() => insertTemplate('reminder_needed')}
                    disabled={isSending}
                  >
                    Reminder needed
                  </button>
                </div>
                <div className="action-buttons">
                  {activeTab === 'nominees' && (
                    <button 
                      className="btn-flag"
                      onClick={handleOpenFlagModal}
                      disabled={!selectedItem}
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: selectedItem ? 'pointer' : 'not-allowed',
                        fontWeight: 500,
                        marginRight: 'auto'
                      }}
                    >
                      Flag Application
                    </button>
                  )}
                  <button 
                    className="btn-secondary"
                    onClick={handleViewDetails}
                    disabled={!selectedItem}
                    style={{marginLeft: activeTab === 'nominees' ? '0' : 'auto'}}
                  >
                    View details
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={() => handleSendClick('reply')}
                    disabled={isSending || !replyMessage.trim()}
                  >
                    {isSending ? 'Sending...' : 'Send reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="customer-support-wrapper">
      <div className="customer-support-container">
        {/* 主标题 */}
        <div className="page-title">
          <h1>Support Workspace</h1>
        </div>

        {/* 搜索和过滤栏 */}
        <div className="toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Search elders, applications, IDs..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
          <div className="filter-group">
            <label className="filter-label">Status:</label>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button
                className={`filter-button ${filterValue === '' ? 'active' : ''}`}
                onClick={() => onFilterValueChange('')}
              >
                All
              </button>
              <button
                className={`filter-button ${filterValue === 'open' ? 'active' : ''}`}
                onClick={() => onFilterValueChange('open')}
              >
                Open
              </button>
              <button
                className={`filter-button ${filterValue === 'in_progress' ? 'active' : ''}`}
                onClick={() => onFilterValueChange('in_progress')}
              >
                In Progress
              </button>
              <button
                className={`filter-button ${filterValue === 'resolved' ? 'active' : ''}`}
                onClick={() => onFilterValueChange('resolved')}
              >
                Resolved
              </button>
            </div>

            <label className="filter-label" style={{marginLeft: '1.5rem'}}>Sort:</label>
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="latest">By latest date</option>
              <option value="oldest">By oldest date</option>
              <option value="name">By name</option>
            </select>
          </div>
        </div>

        {/* 标签页 */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => onTabChange('inquiries')}
          >
            Inquiries
          </button>
          <button 
            className={`tab ${activeTab === 'nominees' ? 'active' : ''}`}
            onClick={() => onTabChange('nominees')}
          >
            Nominees
          </button>
          <button 
            className={`tab ${activeTab === 'healthReports' ? 'active' : ''}`}
            onClick={() => onTabChange('healthReports')}
          >
            Health Report
          </button>
        </div>

        {/* 主内容区域：左侧列表 + 右侧详情 */}
        <div className="content-area">
          {/* 左侧列表 */}
          <div className="list-panel">
            <div className="list-header">
              <span className="list-label">ELDER</span>
              <span className="list-label">INQUIRY</span>
              <span className="list-label">LAST ACTIVITY</span>
            </div>
            <div className="list-content">
              {loading ? (
                <div className="loading">Loading...</div>
              ) : data.length === 0 ? (
                <div className="empty-state">No data found</div>
              ) : (
                data.map(renderListItem)
              )}
            </div>
          </div>

          {/* 右侧详情 */}
          <div className="detail-panel">
            {renderDetailPanel()}
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="settings-section">
        <div className="settings-container">
          <h2 className="settings-heading">Website Contact Settings</h2>
          
          {contactError && (
            <div className="alert alert-error">{contactError}</div>
          )}

          {contactSuccess && (
            <div className="alert alert-success">{contactSuccess}</div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); onSaveContactSettings() }} className="settings-form">
            <div className="form-group">
              <label className="form-label">Contact Email Address</label>
              <input
                type="email"
                className="form-input"
                value={contactEmail}
                onChange={(e) => onContactEmailChange(e.target.value)}
                placeholder="support@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone Number</label>
              <input
                type="tel"
                className="form-input"
                value={contactPhone}
                onChange={(e) => onContactPhoneChange(e.target.value)}
                placeholder="03-1112 9429"
                required
              />
            </div>

            <div className="button-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={contactLoading}
              >
                {contactLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inquiry Detail Modal (Used for all tabs - conversations) */}
      {showModal && selectedItem && (
        <InquiryDetailModal
          inquiry={selectedItem}
          conversations={conversations || []}
          onClose={handleCloseModal}
          onSendReply={onSendReply}
          onSaveDraft={(draft) => console.log('Draft saved:', draft)}
          onMarkResolved={(id) => onUpdateStatus(id, 'resolved')}
          nominees={selectedNominees}
          activeTab={activeTab}
          onFlag={handleOpenFlagModal}
        />
      )}

      {/* Nominee Detail Modal */}
      {showNomineeModal && (
        <NomineeDetailModal
          nominees={selectedNominees || []}
          inquiry={selectedItem}
          onClose={handleCloseNomineeModal}
        />
      )}

      {/* Flag Application Modal */}
      {showFlagModal && selectedItem && (
        <FlagApplicationModal
          onClose={handleCloseFlagModal}
          onFlag={handleFlagApplication}
        />
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && pdfUrl && (
        <PDFViewer
          fileUrl={pdfUrl}
          fileName={pdfFileName}
          onClose={handleClosePDFViewer}
        />
      )}
    </div>
  )
}