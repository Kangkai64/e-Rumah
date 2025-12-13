// src/views/CustomerSupportView.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import './CustomerSupport.css'
import Footer from '../layouts/Footer'
import logoSrc from '../assets/images/logo.png'
import vectorSrc from '../assets/images/Vector.svg'
import { signOut } from '../services/authService'

export default function CustomerSupportView({
  activeTab,
  onTabChange,
  data,
  selectedItem,
  onSelectItem,
  replies,
  onSendReply,
  onUpdateStatus,
  loading,
  searchTerm,
  onSearch,
  filterStatus,
  onFilterChange
}) {
  const [replyMessage, setReplyMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sortBy, setSortBy] = useState('latest')
  const navigate = useNavigate() // ✨ 新增 navigate hook

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

  // ✨ 新增：处理跳转到更新页面
  const handleNavigateToUpdate = () => {
    navigate('/update-customer-support')
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
            <span className="item-name">{item.user?.name || item.elder?.name || 'Unknown User'}</span>
            <span className="item-date">{formatDate(item.created_at)}</span>
          </div>
          <div className="item-subject">{item.subject}</div>
        </div>
      )
    }

    if (activeTab === 'applications') {
      return (
        <div 
          key={item.id}
          className={`support-list-item ${isSelected ? 'active' : ''}`}
          onClick={() => onSelectItem(item)}
        >
          <div className="item-header">
            <span className="item-name">{item.application_number}</span>
            <span className="item-date">{formatDate(item.created_at)}</span>
          </div>
          <div className="item-subject">Status: {item.status}</div>
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
            <span className="item-name">{item.elder?.name || 'Unknown'}</span>
            <span className="item-date">{formatDate(item.created_at)}</span>
          </div>
          <div className="item-subject">IC: {item.elder?.ic_number}</div>
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
              <span>{selectedItem.user?.name || selectedItem.elder?.name || 'Unknown'} • Email</span>
            </div>
          </div>

          <div className="detail-section">
            <p className="detail-label">Preferred contact</p>
            <p className="detail-value">
              {selectedItem.contact_preference || 'SMS & Email'}
            </p>
          </div>

          <div className="detail-section">
            <p className="detail-label">CONTENT</p>
            <p className="detail-value">{selectedItem.content}</p>
          </div>

          <div className="detail-section">
            <p className="detail-label">INTERNAL NOTE</p>
            <p className="detail-value detail-note">
              {selectedItem.internal_note || 'Working note\ne.g. Verified ID, will send checklist for correct income document.'}
            </p>
          </div>

          {/* 回复历史 */}
          {replies.length > 0 && (
            <div className="detail-section">
              <p className="detail-label">REPLY HISTORY</p>
              <div className="reply-history">
                {replies.map((reply) => (
                  <div key={reply.id} className="reply-item">
                    <p className="reply-meta">
                      {reply.support_user?.name || 'Support'} • {formatDate(reply.created_at)}
                    </p>
                    <p className="reply-message">{reply.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 回复表单 */}
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
                  <button className="btn-secondary">View details</button>
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
        </div>
      )
    }

    // Applications 和 Nominees 的详情显示（简化版）
    return (
      <div className="detail-content">
        <div className="detail-header">
          <h3>{activeTab === 'applications' ? 'Application' : 'Nominee'} Details</h3>
        </div>
        <pre className="detail-json">{JSON.stringify(selectedItem, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="customer-support-wrapper">
      <div className="customer-support-container">
        {/* Support Header (visual-only variant copied from Header.jsx) */}
        <header className="site-header">
          <div className="header-container">
            <Link to="/" className="logo">
              <img src={logoSrc} alt="e-Rumah" className="logo-image" />
            </Link>

            <nav className="main-nav">
              <Link to="/support/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/update-customer-support" className="nav-link">Contact Update</Link>
            </nav>

            <div className="header-actions">
              <button
                className="logout-btn"
                onClick={async () => { try { await signOut() } catch (e){} navigate('/') }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

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
            <label className="filter-label">Filter field:</label>
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => onFilterChange(e.target.value)}
            >
              <option value="">Status</option>
              <option value="">Any</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <label className="filter-label">Value:</label>
            <select className="filter-select" value={filterStatus}>
              <option value="">Any</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            <label className="filter-label">Sort:</label>
            <select 
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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
            className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => onTabChange('applications')}
          >
            Applications
          </button>
          <button 
            className={`tab ${activeTab === 'nominees' ? 'active' : ''}`}
            onClick={() => onTabChange('nominees')}
          >
            Nominees
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

      {/* Footer */}
      <Footer />
    </div>
  )
}