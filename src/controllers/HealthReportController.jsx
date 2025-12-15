// HealthReport Controller - Smart React Component
// Entry point for users - manages all state and business logic
// Renders HealthReportView (pure presentational component)
// NO imports from other controllers allowed!

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import HealthReportView from '../views/HealthReportView'
import { 
  getHealthReports, 
  uploadHealthReport, 
  deleteHealthReport, 
  shareHealthReport,
  checkHealthReportAlerts,
  getDueReports
} from '../services/healthReportService'
import { getCurrentUser } from '../services/authService'

function HealthReportController() {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reports, setReports] = useState([])
  const [filteredReports, setFilteredReports] = useState([])
  const [alerts, setAlerts] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Filter and sort state
  const [searchKey, setSearchKey] = useState('')
  const [filters, setFilters] = useState({
    reportType: '',
    startDate: '',
    endDate: '',
    healthcareProvider: '',
    uploadStatus: '',
    dueStatus: ''
  })
  const [sortBy, setSortBy] = useState('report_date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    reportType: '',
    reportDate: '',
    healthcareProvider: '',
    notes: '',
    file: null
  })

  // Share form state
  const [shareForm, setShareForm] = useState({
    shareOption: '',
    caregiverId: '',
    familyMemberId: '',
    providerEmail: '',
    email: '',
    expiryDays: 7
  })

  // Initialize - fetch user and reports
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true)
        
        // Get current user
        const user = await getCurrentUser()
        if (!user) {
          navigate('/login')
          return
        }
        setCurrentUser(user)

        // Fetch health reports
        await fetchReports(user.id)

        // Check for alerts
        await checkAlerts(user.id)
      } catch (err) {
        console.error('Error initializing:', err)
        setError('Failed to load health reports')
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [navigate])

  // Fetch reports
  const fetchReports = async (userId) => {
    try {
      const options = {
        searchKey: searchKey || undefined,
        reportType: filters.reportType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        healthcareProvider: filters.healthcareProvider || undefined,
        uploadStatus: filters.uploadStatus || undefined,
        dueStatus: filters.dueStatus || undefined,
        sortBy,
        sortOrder
      }

      const result = await getHealthReports(userId, options)
      
      if (result.success) {
        setReports(result.data)
        setFilteredReports(result.data)
        
        if (result.data.length === 0) {
          setError('No data found')
        } else {
          setError(null)
        }
      } else {
        setError(result.error)
        setReports([])
        setFilteredReports([])
      }
    } catch (err) {
      console.error('Error fetching reports:', err)
      setError('Failed to fetch health reports')
      setReports([])
      setFilteredReports([])
    }
  }

  // Check for due/overdue alerts
  const checkAlerts = async (userId) => {
    try {
      const result = await checkHealthReportAlerts(userId)
      if (result.success) {
        setAlerts(result.data)
      }
    } catch (err) {
      console.error('Error checking alerts:', err)
    }
  }

  // Handle search
  const handleSearch = useCallback(() => {
    if (currentUser) {
      fetchReports(currentUser.id)
    }
  }, [currentUser, searchKey])

  // Handle filter
  const handleFilter = useCallback(() => {
    if (currentUser) {
      fetchReports(currentUser.id)
    }
  }, [currentUser, filters])

  // Handle sort
  const handleSort = useCallback((field) => {
    const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortBy(field)
    setSortOrder(newOrder)
  }, [sortBy, sortOrder])

  // Apply sort and filter changes
  useEffect(() => {
    if (currentUser) {
      fetchReports(currentUser.id)
    }
  }, [sortBy, sortOrder])

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    setUploadForm(prev => ({ ...prev, file }))
  }, [])

  // Handle drag and drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
      setShowUploadModal(true)
    }
  }, [handleFileSelect])

  // Handle upload form change
  const handleUploadFormChange = useCallback((field, value) => {
    setUploadForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Handle upload submit
  const handleUploadSubmit = async () => {
    try {
      setIsUploading(true)
      setError(null)

      // Validate form
      if (!uploadForm.file) {
        setError('Please select a file')
        return
      }
      if (!uploadForm.reportType) {
        setError('Please select report type')
        return
      }
      if (!uploadForm.reportDate) {
        setError('Please select report date')
        return
      }
      if (!uploadForm.healthcareProvider) {
        setError('Please enter healthcare provider')
        return
      }

      // Upload report
      const result = await uploadHealthReport(
        currentUser.id,
        uploadForm.file,
        {
          reportType: uploadForm.reportType,
          reportDate: uploadForm.reportDate,
          healthcareProvider: uploadForm.healthcareProvider,
          notes: uploadForm.notes
        }
      )

      if (result.success) {
        setSuccessMessage('Health report uploaded successfully')
        setShowUploadModal(false)
        setUploadForm({
          reportType: '',
          reportDate: '',
          healthcareProvider: '',
          notes: '',
          file: null
        })
        
        // Refresh reports
        await fetchReports(currentUser.id)
        await checkAlerts(currentUser.id)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error uploading report:', err)
      setError('Failed to upload health report')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle report selection
  const handleReportSelect = useCallback((report) => {
    setSelectedReport(report)
  }, [])

  // Handle share click
  const handleShareClick = useCallback((report) => {
    setSelectedReport(report)
    setShowShareModal(true)
  }, [])

  // Handle share form change
  const handleShareFormChange = useCallback((field, value) => {
    setShareForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Handle share submit
  const handleShareSubmit = async () => {
    try {
      setError(null)

      if (!shareForm.shareOption) {
        setError('Please select a sharing option')
        return
      }

      const result = await shareHealthReport(
        selectedReport.id,
        shareForm.shareOption,
        shareForm
      )

      if (result.success) {
        if (result.action === 'download') {
          // Trigger download
          window.open(result.url, '_blank')
        } else if (result.data?.shareUrl) {
          // Copy link to clipboard
          navigator.clipboard.writeText(result.data.shareUrl)
          setSuccessMessage('Shareable link copied to clipboard')
        } else {
          setSuccessMessage(result.message || 'Report shared successfully')
        }
        
        setShowShareModal(false)
        setShareForm({
          shareOption: '',
          caregiverId: '',
          familyMemberId: '',
          providerEmail: '',
          email: '',
          expiryDays: 7
        })
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error sharing report:', err)
      setError('Failed to share health report')
    }
  }

  // Handle delete
  const handleDelete = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this health report?')) {
      return
    }

    try {
      const result = await deleteHealthReport(reportId)
      
      if (result.success) {
        setSuccessMessage('Health report deleted successfully')
        await fetchReports(currentUser.id)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error deleting report:', err)
      setError('Failed to delete health report')
    }
  }

  // Handle cancel
  const handleCancel = useCallback(() => {
    setShowUploadModal(false)
    setShowShareModal(false)
    setSelectedReport(null)
    setUploadForm({
      reportType: '',
      reportDate: '',
      healthcareProvider: '',
      notes: '',
      file: null
    })
    setShareForm({
      shareOption: '',
      caregiverId: '',
      familyMemberId: '',
      providerEmail: '',
      email: '',
      expiryDays: 7
    })
    setError(null)
  }, [])

  // Handle help
  const handleHelp = useCallback(() => {
    // Navigate to help page or show help modal
    navigate('/help')
  }, [navigate])

  // Handle exit
  const handleExit = useCallback(() => {
    navigate('/home')
  }, [navigate])

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Render view
  return (
    <HealthReportView
      // State
      isLoading={isLoading}
      reports={filteredReports}
      selectedReport={selectedReport}
      alerts={alerts}
      error={error}
      successMessage={successMessage}
      isDragging={isDragging}
      isUploading={isUploading}
      uploadProgress={uploadProgress}
      showShareModal={showShareModal}
      showUploadModal={showUploadModal}
      
      // Filter and sort
      searchKey={searchKey}
      filters={filters}
      sortBy={sortBy}
      sortOrder={sortOrder}
      
      // Forms
      uploadForm={uploadForm}
      shareForm={shareForm}
      
      // Handlers
      onSearch={handleSearch}
      onSearchKeyChange={setSearchKey}
      onFilter={handleFilter}
      onFilterChange={setFilters}
      onSort={handleSort}
      onFileSelect={handleFileSelect}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onUploadFormChange={handleUploadFormChange}
      onUploadSubmit={handleUploadSubmit}
      onReportSelect={handleReportSelect}
      onShareClick={handleShareClick}
      onShareFormChange={handleShareFormChange}
      onShareSubmit={handleShareSubmit}
      onDelete={handleDelete}
      onCancel={handleCancel}
      onHelp={handleHelp}
      onExit={handleExit}
      onShowUploadModal={() => setShowUploadModal(true)}
    />
  )
}

export default HealthReportController
