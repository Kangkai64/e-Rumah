// src/views/UserSupportView.jsx
import React, { useState } from 'react'
import '../client_controller/userSupport/UserSupport.css'
import contactIcon from '../assets/icons/about_us_page/icon_contact.svg'
import emailIcon from '../assets/icons/about_us_page/icon_email.svg'

export default function UserSupportView({
  inquiries,
  selectedInquiry,
  conversations,
  onSelectInquiry,
  onCreateInquiry,
  onSendMessage,
  loading,
  contactEmail,
  contactPhone
}) {
  const [showModal, setShowModal] = useState(false)
  const [newInquirySubject, setNewInquirySubject] = useState('inquiries')
  const [newInquiryMessage, setNewInquiryMessage] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [sending, setSending] = useState(false)
  const fileInputRef = React.useRef(null)

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

  const formatShortDate = (dateString) => {
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = date.toLocaleString('en-US', { month: 'short' })
    return `${day} ${month}`
  }

  const getStatusClass = (status) => {
    if (status === 'open') return 'status-open'
    if (status === 'in_progress') return 'status-in_progress'
    if (status === 'resolved') return 'status-resolved'
    return 'status-open'
  }

  const formatStatus = (status) => {
    if (!status) return 'Open'
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const formatSubject = (subject) => {
    if (subject === 'inquiries') return 'General Inquiries'
    if (subject === 'health_report') return 'Health Report'
    if (subject === 'nominee') return 'Nominee'
    return subject
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || sending) return

    setSending(true)
    const result = await onSendMessage(messageInput, selectedFile)
    
    if (result?.success) {
      setMessageInput('')
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    setSending(false)
  }

  const handleOpenModal = () => {
    setShowModal(true)
    setNewInquirySubject('inquiries')
    setNewInquiryMessage('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setNewInquirySubject('inquiries')
    setNewInquiryMessage('')
  }

  const handleSubmitInquiry = async () => {
    if (!newInquiryMessage.trim()) return

    const result = await onCreateInquiry({
      subject: newInquirySubject,
      message: newInquiryMessage
    })

    if (result?.success) {
      handleCloseModal()
    }
  }

  if (loading) {
    return (
      <div className="user-support-container">
        <div className="loading-container">
          <p>Loading support...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-support-container">
      {/* Header */}
      <div className="support-header">
        <h1>Support</h1>
        <p>Get help from our customer support team</p>
      </div>

      {/* Main Content */}
      <div className="support-main">
        {/* Inquiry List Panel */}
        <div className="inquiry-list-panel">
          <div className="inquiry-list-header">
            <h2>My Inquiries</h2>
            <button className="new-inquiry-btn" onClick={handleOpenModal}>
              + New
            </button>
          </div>

          <div className="inquiry-list">
            {inquiries && inquiries.length > 0 ? (
              inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className={`inquiry-item ${selectedInquiry?.id === inquiry.id ? 'active' : ''}`}
                  onClick={() => onSelectInquiry(inquiry)}
                >
                  <div className="inquiry-item-header">
                    <span className="inquiry-subject">{formatSubject(inquiry.subject)}</span>
                    <span className={`inquiry-status-badge ${getStatusClass(inquiry.status)}`}>
                      {formatStatus(inquiry.status)}</span>
                  </div>
                  <p className="inquiry-preview">{inquiry.message}</p>
                  <span className="inquiry-date">{formatShortDate(inquiry.created_at)}</span>
                </div>
              ))
            ) : (
              <div className="empty-inquiry-list">
                <p>No inquiries yet</p>
                <p style={{fontSize: '0.75rem', marginTop: '0.5rem'}}>
                  Click "New" to create your first inquiry
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="chat-panel">
          {selectedInquiry ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <h3 className="chat-title">Conversation</h3>
                <p className="chat-subtitle">
                  Started on {formatDate(selectedInquiry.created_at)}
                </p>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {/* Initial inquiry message */}
                <div className="message user-message">
                  <span className="message-sender">You</span>
                  <div className="message-bubble">{selectedInquiry.message}</div>
                  <span className="message-time">{formatDate(selectedInquiry.created_at)}</span>
                </div>

                {/* Conversation messages */}
                {conversations && conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`message ${conv.sender_type === 'elder' ? 'user-message' : 'support-message'}`}
                  >
                    <span className="message-sender">
                      {conv.sender_type === 'elder' ? 'You' : (conv.sender?.full_name || 'Support Team')}
                    </span>
                    <div className="message-bubble">
                      {conv.message}
                      {conv.file_url && (
                        <div className="message-attachment">
                          <a 
                            href={conv.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="attachment-link"
                          >
                            📎 {conv.file_name || 'Download Attachment'}
                          </a>
                        </div>
                      )}
                    </div>
                    <span className="message-time">{formatDate(conv.created_at)}</span>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className={`chat-input-area ${selectedInquiry.status === 'resolved' ? 'disabled' : ''}`}>
                {selectedInquiry.status === 'resolved' ? (
                  <div className="resolved-notice">
                    ✓ This inquiry has been resolved and is now closed
                  </div>
                ) : (
                  <>
                    {/* Selected File Display */}
                    {selectedFile && (
                      <div className="selected-file-display">
                        <span className="file-icon">📎</span>
                        <span className="file-name">{selectedFile.name}</span>
                        <button 
                          className="file-remove-btn" 
                          onClick={handleRemoveFile}
                          type="button"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <div className="chat-input-container">
                      <textarea
                        className="chat-input"
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={sending}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                    </div>

                    <div className="chat-actions">
                      <button
                        className="attach-file-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending}
                        type="button"
                      >
                        📎 Attach File
                      </button>
                      <button
                        className="send-btn"
                        onClick={handleSendMessage}
                        disabled={sending || (!messageInput.trim() && !selectedFile)}
                      >
                        {sending ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="empty-chat">
              <div className="empty-chat-icon">💬</div>
              <p>Select an inquiry to view the conversation</p>
              <p style={{fontSize: '0.875rem', marginTop: '0.5rem'}}>
                Or create a new inquiry to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="contact-info-section">
        <h3>Need Immediate Assistance?</h3>
        <div className="contact-details">
          <div className="contact-item">
            <img src={emailIcon} alt="Email" />
            <div className="contact-text">
              <p className="contact-label">Email</p>
              <a href={`mailto:${contactEmail || 'support@erumah.com'}`} className="contact-value">
                {contactEmail || 'support@erumah.com'}
              </a>
            </div>
          </div>
          <div className="contact-item">
            <img src={contactIcon} alt="Phone" />
            <div className="contact-text">
              <p className="contact-label">Phone</p>
              <a href={`tel:${contactPhone || '03-1112 9429'}`} className="contact-value">
                {contactPhone || '03-1112 9429'}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* New Inquiry Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Inquiry</h2>
              <p>Our support team will respond as soon as possible</p>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={newInquirySubject}
                onChange={(e) => setNewInquirySubject(e.target.value)}
              >
                <option value="inquiries">General Inquiries</option>
                <option value="health_report">Health Report</option>
                <option value="nominee">Nominee</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea
                className="form-textarea"
                placeholder="Describe your issue in detail..."
                value={newInquiryMessage}
                onChange={(e) => setNewInquiryMessage(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={handleCloseModal}>
                Cancel
              </button>
              <button
                className="inquiry-submit-btn"
                onClick={handleSubmitInquiry}
                disabled={!newInquiryMessage.trim()}
              >
                Submit Inquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
