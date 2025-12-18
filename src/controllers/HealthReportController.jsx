// HealthReport Controller - Smart React Component
// Entry point for users - manages all state and business logic
// Renders HealthReportView (pure presentational component)
// NO imports from other controllers allowed!

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import HealthMonitoringView from '../views/HealthMonitoringView'
import { supabase } from '../config/supabase'
import { uploadDocument, uploadHealthReport as uploadHealthReportFile } from '../services/fileUploadService'
import {
  getHealthReports,
  uploadHealthReport,
  deleteHealthReport,
  shareHealthReport,
  checkHealthReportAlerts,
  getAllHealthReports,
  approveHealthReport,
  flagHealthReport,
  archiveHealthReport,
  getHealthReportsByApplication,
  updateHealthReportStatus,
  updateHealthReportDueStatus
} from '../models/HealthReport'
import { useAuth } from '../components/context/AuthContext'
import { processPDF } from '../utils/pdfCompression'

function HealthReportController() {
  const navigate = useNavigate()
  const { applicationId } = useParams() // Extract applicationId from URL if present
  const { user, userRole } = useAuth()
  const [currentUser, setCurrentUser] = useState(null)

  // Debug logging for applicationId
  console.log('HealthReportController - applicationId from URL params:', applicationId)
  console.log('HealthReportController - Current URL:', window.location.href)
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
  const [activeTab, setActiveTab] = useState('archived')
  const [showFilters, setShowFilters] = useState(false)
  const [errors, setErrors] = useState({})
  const [statistics, setStatistics] = useState({
    reminderThisWeek: 0,
    overdueHealthReport: 0,
    healthReportDueSoon: 0,
    flaggedHealthReport: 0
  })

  // Admin specific state
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [actionReport, setActionReport] = useState(null)

  // Filter and sort state
  const [searchKey, setSearchKey] = useState('')
  const [filters, setFilters] = useState({
    reportType: '',
    startDate: '',
    endDate: '',
    uploadStatus: '',
    dueStatus: ''
  })
  const [sortBy, setSortBy] = useState('report_date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    reportType: '',
    reportDate: '',
    notes: '',
    file: null
  })

  // Multi-file upload form state
  const [multiUploadForm, setMultiUploadForm] = useState({
    reportType: 'Medical Report',
    reportDate: new Date().toISOString().split('T')[0], // Default to today
    customReportType: ''
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

        // Use user from AuthContext instead of making additional API call
        if (!user) {
          console.warn('User not found in AuthContext')
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
  }, [navigate, user])

  // Fetch reports
  const fetchReports = async (userId) => {
    try {
      const options = {
        searchKey: searchKey || undefined,
        reportType: filters.reportType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        uploadStatus: filters.uploadStatus || undefined,
        dueStatus: filters.dueStatus || undefined,
        sortBy,
        sortOrder,
        showArchived: activeTab === 'archived' || userRole === 'admin'
      }

      // Use different function based on user role
      const result = userRole === 'admin' || userRole === 'staff'
        ? await getAllHealthReports(options)
        : await getHealthReports(userId, options)

      if (result.success) {
        setReports(result.data)
        setFilteredReports(result.data)
        setError(null)
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

  // Get user's application ID when not provided in URL
  const getUserApplicationId = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user application:', error)
        return null
      }

      return data?.id || null
    } catch (err) {
      console.error('Error fetching application:', err)
      return null
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

  // Client-side filtering for real-time search and filter functionality
  useEffect(() => {
    if (!reports || reports.length === 0) {
      setFilteredReports([])
      return
    }

    let filtered = reports.filter(report => {
      // Search filter - search across multiple fields
      if (searchKey && searchKey.trim()) {
        const searchTerm = searchKey.toLowerCase().trim()
        const matchesSearch = 
          (report.report_type && report.report_type.toLowerCase().includes(searchTerm)) ||
          (report.notes && report.notes.toLowerCase().includes(searchTerm)) ||
          (report.id && report.id.toLowerCase().includes(searchTerm))
        
        if (!matchesSearch) return false
      }

      // Report type filter
      if (filters.reportType && report.report_type !== filters.reportType) {
        return false
      }

      // Due status filter  
      if (filters.dueStatus && report.due_status !== filters.dueStatus) {
        return false
      }

      // Date range filter
      if (filters.startDate) {
        const reportDate = new Date(report.report_date)
        const startDate = new Date(filters.startDate)
        if (reportDate < startDate) return false
      }

      if (filters.endDate) {
        const reportDate = new Date(report.report_date)
        const endDate = new Date(filters.endDate)
        if (reportDate > endDate) return false
      }

      return true
    })

    // Apply tab filter
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'overdue':
          filtered = filtered.filter(r => r.due_status === 'Overdue')
          break
        case 'due-soon':
          filtered = filtered.filter(r => r.due_status === 'Due Soon')
          break
        case 'up-to-date':
          filtered = filtered.filter(r => r.due_status === 'Up to Date')
          break
        default:
          break
      }
    }

    setFilteredReports(filtered)
  }, [reports, searchKey, filters, activeTab])

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

  // Handle multi-upload form change
  const handleMultiUploadFormChange = useCallback((field, value) => {
    setMultiUploadForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Handle upload submit
  const handleUploadSubmit = async () => {
    try {
      setIsUploading(true)
      setError(null)

      console.log('🔍 Single file upload - applicationId from URL:', applicationId)
      
      // Get user's application ID if not provided in URL
      const finalApplicationId = applicationId || await getUserApplicationId(currentUser.id)
      console.log('🔍 Single file upload - final applicationId to use:', finalApplicationId)

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

      // Upload report
      const result = await uploadHealthReport(
        currentUser.id,
        uploadForm.file,
        {
          reportType: uploadForm.reportType,
          applicationId: finalApplicationId || null,
          reportDate: uploadForm.reportDate,
          notes: uploadForm.notes
        }
      )

      console.log('📤 Upload result:', result)

      if (result.success) {
        setSuccessMessage('Health report uploaded successfully')
        setShowUploadModal(false)
        setUploadForm({
          reportType: '',
          reportDate: '',
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

  // Handle multiple file upload - NEW BUSINESS LOGIC
  const handleMultipleFileUpload = async (files) => {
    try {
      console.log('🚀 Starting upload process for', files.length, 'files');
      console.log('🔍 Multiple file upload - applicationId from URL:', applicationId);
      
      // Get user's application ID if not provided in URL
      const finalApplicationId = applicationId || await getUserApplicationId(currentUser.id)
      console.log('🔍 Multiple file upload - final applicationId to use:', finalApplicationId);

      const uploadResults = [];
      const healthReportRecords = [];

      // Determine report type
      const reportType = multiUploadForm.reportType === 'Others'
        ? multiUploadForm.customReportType
        : multiUploadForm.reportType;

      if (!reportType) {
        return {
          success: false,
          error: 'Please select a report type or specify custom type for "Others"'
        };
      }

      // Upload each file to Supabase Storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📤 Processing file ${i + 1}/${files.length}:`, file.name);

        // Process PDF (compress, validate, repair if needed)
        let processedFile = file;
        if (file.type === 'application/pdf') {
          console.log('🔄 Processing PDF file...');
          const processResult = await processPDF(file, {
            compress: true,
            compressionLevel: 0.8,
            maxFileSize: 5 * 1024 * 1024 // 5MB
          });
          
          if (processResult.success) {
            processedFile = processResult.file;
            console.log('✅ PDF processed successfully');
          } else {
            console.warn('⚠️ PDF processing failed, using original file:', processResult.error);
          }
        }

        // Upload file using the health report specific service (PDF only)
        const uploadResult = await uploadHealthReportFile(
          processedFile,
          currentUser.id,
          'health_report',
          {
            signedUrlDuration: 31536000 // 1 year
          }
        );

        if (uploadResult.error) {
          console.error('❌ Upload failed for', processedFile.name, ':', uploadResult.error);
          return {
            success: false,
            error: `Failed to upload ${processedFile.name}: ${uploadResult.error.message}`
          };
        }

        uploadResults.push({
          file: processedFile,
          originalFile: file,
          uploadResult
        });

        // Prepare health report record
        const healthReportRecord = {
          user_id: currentUser.id,
          application_id: finalApplicationId || null, // Use finalApplicationId
          report_date: multiUploadForm.reportDate,
          report_type: reportType,
          report_file_url: uploadResult.url,
          notes: '', // Left empty for admin purpose
          health_report_status: 'Pending',
          due_status: 'Up to Date'
        };

        console.log('💾 Health report record being prepared:', healthReportRecord);

        healthReportRecords.push(healthReportRecord);

        console.log('✅ File uploaded successfully:', {
          fileName: processedFile.name,
          url: uploadResult.url,
          size: formatFileSize(file.size)
        });
      }

      // Insert health report records into database
      console.log('💾 Inserting health report records into database...');

      const { data: insertedRecords, error: insertError } = await supabase
        .from('health_reports')
        .insert(healthReportRecords)
        .select();

      if (insertError) {
        console.error('❌ Database insertion failed:', insertError);
        return {
          success: false,
          error: 'Files uploaded but failed to save records to database. Please contact support.'
        };
      }

      console.log('✅ Health report records created successfully:', insertedRecords);

      // Refresh reports
      await fetchReports(currentUser.id);
      await checkAlerts(currentUser.id);

      console.log('🎊 Upload process completed successfully!');

      return {
        success: true,
        data: {
          uploadResults,
          healthReportRecords: insertedRecords,
          fileCount: files.length
        }
      };

    } catch (error) {
      console.error('💥 Upload process failed:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred. Please try again.'
      };
    }
  }

  // Helper function for file size formatting
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  // Handle exit
  const handleExit = useCallback(() => {
    navigate('/')
  }, [navigate])

  // Calculate statistics based on actual health report data
  useEffect(() => {
    if (reports && reports.length > 0) {
      const now = new Date()
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const stats = {
        reminderThisWeek: reports.filter(r => {
          const reportDate = new Date(r.report_date)
          return reportDate >= now && reportDate <= oneWeekFromNow
        }).length,
        overdueHealthReport: reports.filter(r => r.due_status === 'Overdue').length,
        healthReportDueSoon: reports.filter(r => r.due_status === 'Due Soon').length,
        flaggedHealthReport: reports.filter(r => r.health_report_status === 'Flagged').length
      }
      setStatistics(stats)
    } else {
      setStatistics({
        reminderThisWeek: 0,
        overdueHealthReport: 0,
        healthReportDueSoon: 0,
        flaggedHealthReport: 0
      })
    }
  }, [reports])

  // Handle admin-specific actions
  const handleApproveClick = useCallback((report) => {
    setActionReport(report)
    setShowApprovalConfirm(true)
  }, [])

  const handleApproveConfirm = useCallback(async () => {
    if (!actionReport || !currentUser) return

    try {
      const result = await approveHealthReport(actionReport.id, currentUser.id)
      if (result.success) {
        setSuccessMessage(result.message || 'Report approved successfully')
        fetchReports(currentUser.id)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error approving report:', err)
      setError('Failed to approve report')
    } finally {
      setShowApprovalConfirm(false)
      setActionReport(null)
    }
  }, [actionReport, currentUser])

  const handleFlagClick = useCallback((report) => {
    setActionReport(report)
    setFlagReason('')
    setShowFlagModal(true)
  }, [])

  const handleFlagConfirm = useCallback(async () => {
    if (!actionReport || !currentUser || !flagReason.trim()) {
      setError('Flag reason is required')
      return
    }

    try {
      const result = await flagHealthReport(actionReport.id, currentUser.id, flagReason.trim())
      if (result.success) {
        setSuccessMessage(result.message || 'Report flagged successfully')
        fetchReports(currentUser.id)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error flagging report:', err)
      setError('Failed to flag report')
    } finally {
      setShowFlagModal(false)
      setActionReport(null)
      setFlagReason('')
    }
  }, [actionReport, currentUser, flagReason])

  const handleArchiveClick = useCallback((report) => {
    setActionReport(report)
    setShowArchiveConfirm(true)
  }, [])

  const handleArchiveConfirm = useCallback(async () => {
    if (!actionReport || !currentUser) return

    try {
      const result = await archiveHealthReport(actionReport.id, currentUser.id)
      if (result.success) {
        setSuccessMessage(result.message || 'Report archived successfully')
        fetchReports(currentUser.id)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('Error archiving report:', err)
      setError('Failed to archive report')
    } finally {
      setShowArchiveConfirm(false)
      setActionReport(null)
    }
  }, [actionReport, currentUser])

  const handleCancelAdminAction = useCallback(() => {
    setShowApprovalConfirm(false)
    setShowArchiveConfirm(false)
    setShowFlagModal(false)
    setActionReport(null)
    setFlagReason('')
  }, [])

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    if (currentUser) {
      fetchReports(currentUser.id)
    }
  }, [currentUser])

  const handleViewReport = useCallback((reportId) => {
    // View report logic
    console.log('Viewing report:', reportId)
  }, [])

  // Filter handlers
  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }, [])

  const handleClearFilters = useCallback(() => {
    setSearchKey('')
    setFilters({
      reportType: '',
      startDate: '',
      endDate: '',
      uploadStatus: '',
      dueStatus: ''
    })
    setActiveTab('all')
  }, [])

  const handleTabFilter = useCallback((tab) => {
    setActiveTab(tab)
  }, [])

  // Auto-hide success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Render view with role-based conditional rendering
  return (
    <HealthMonitoringView
      // User role
      userRole={userRole}

      // User data
      user={currentUser}

      // Admin props
      isLoading={isLoading}
      statistics={statistics}
      selectedReport={selectedReport}
      activeTab={activeTab}
      showApprovalConfirm={showApprovalConfirm}
      showArchiveConfirm={showArchiveConfirm}
      showFlagModal={showFlagModal}
      flagReason={flagReason}
      actionReport={actionReport}
      onApproveClick={handleApproveClick}
      onApproveConfirm={handleApproveConfirm}
      onFlagClick={handleFlagClick}
      onFlagConfirm={handleFlagConfirm}
      onArchiveClick={handleArchiveClick}
      onArchiveConfirm={handleArchiveConfirm}
      onCancelAdminAction={handleCancelAdminAction}
      onFlagReasonChange={setFlagReason}
      onViewReport={handleViewReport}
      onTabChange={handleTabChange}

      // Common props
      reports={filteredReports}
      alerts={alerts}
      errorMessage={error}
      successMessage={successMessage}
      isDragging={isDragging}
      isUploading={isUploading}
      uploadProgress={uploadProgress}
      showShareModal={showShareModal}
      showUploadModal={showUploadModal}
      errors={errors}

      // Filter and sort
      searchKey={searchKey}
      filters={filters}
      sortBy={sortBy}
      sortOrder={sortOrder}

      // Forms
      uploadForm={uploadForm}
      shareForm={shareForm}
      multiUploadForm={multiUploadForm}

      // Handlers
      onSearchChange={setSearchKey}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
      onTabFilter={handleTabFilter}
      onAdminSort={handleSort}
      onReportSelect={handleReportSelect}
      onSearch={handleSearch}
      onSearchKeyChange={setSearchKey}
      onFilter={handleFilter}
      onFileSelect={handleFileSelect}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onUploadFormChange={handleUploadFormChange}
      onMultiUploadFormChange={handleMultiUploadFormChange}
      onUploadSubmit={handleUploadSubmit}
      onMultipleFileUpload={handleMultipleFileUpload}
      onShareClick={handleShareClick}
      onShareFormChange={handleShareFormChange}
      onShareFormSubmit={handleShareSubmit}
      onDelete={handleDelete}
      onCancel={handleCancel}
      onExit={handleExit}
      onUploadClick={() => setShowUploadModal(true)}
      onCancelUploadModal={handleCancel}
      onCancelShareModal={handleCancel}
      showFilters={showFilters}
      onSetShowFilters={(value) => setShowFilters(!showFilters)}
      onSort={handleSort}
      onDownload={(reportId) => handleViewReport(reportId)}
      applicationId={applicationId}
    />
  )
}

export default HealthReportController
