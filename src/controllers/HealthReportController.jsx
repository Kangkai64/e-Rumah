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
  getHealthReportShares,
  revokeHealthReportShare,
  checkHealthReportAlerts,
  getAllHealthReports,
  approveHealthReport,
  flagHealthReport,
  archiveHealthReport,
  reuploadHealthReport,
  RemindersService,
  REMINDER_TYPES,
  REMINDER_CATEGORIES
} from '../models/HealthReport'
import { useAuth } from '../client_controller/sessionController/AuthContext'
import { processPDF } from '../utils/pdfCompression'
import { convertImagesToPDF, isImageFile, isPDFFile, validateHealthReportFile } from '../utils/pdfConverter'
import { deriveUserBirthDate } from '../utils/deriveUserBirthDate'
import { corsProxyFunctionInvoke } from '../services/corsProxyService'

function HealthReportController() {
  const navigate = useNavigate()
  const { applicationId } = useParams() // Extract applicationId from URL if present
  const { user, userRole } = useAuth()
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
  const [showPDFViewer, setShowPDFViewer] = useState(false)
  const [showArchivedModal, setShowArchivedModal] = useState(false)
  const [viewingReportUrl, setViewingReportUrl] = useState(null)
  const [viewingReport, setViewingReport] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showSort, setShowSort] = useState(false)
  const [errors, setErrors] = useState({})
  const [statistics, setStatistics] = useState({
    reminderThisWeek: 0,
    overdueHealthReport: 0,
    healthReportDueSoon: 0,
    pending: 0,
    reviewed: 0,
    flagged: 0
  })

  // Admin specific state
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showFlagModal, setShowFlagModal] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [actionReport, setActionReport] = useState(null)

  // Reupload confirmation state
  const [showReuploadConfirm, setShowReuploadConfirm] = useState(false)
  const [reuploadFileData, setReuploadFileData] = useState(null)
  const [reuploadReportId, setReuploadReportId] = useState(null)

  // Filter and sort state
  const [searchKey, setSearchKey] = useState('')
  const [filters, setFilters] = useState({
    reportType: '',
    startDate: '',
    endDate: '',
    healthReportStatus: '',
    dueStatus: '',
    providerName: ''
  })
  const [sortBy, setSortBy] = useState('report_date')
  const [sortOrder, setSortOrder] = useState('desc')

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    reportType: '',
    reportDate: '',
    reportTitle: '',
    providerName: '',
    notes: '',
    file: null
  })

  // Multi-file upload form state
  const [multiUploadForm, setMultiUploadForm] = useState({
    reportType: 'Medical Report',
    reportDate: new Date().toISOString().split('T')[0], // Default to today
    reportTitle: '',
    providerName: '',
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
  const [shareLinks, setShareLinks] = useState([])
  const [isShareLinksLoading, setIsShareLinksLoading] = useState(false)

  // ============================================================================
  // REMINDERS STATE MANAGEMENT
  // ============================================================================
  const [reminders, setReminders] = useState([])
  const [upcomingReminders, setUpcomingReminders] = useState([])
  const [overdueReminders, setOverdueReminders] = useState([])
  const [reminderStats, setReminderStats] = useState({
    total: 0,
    upcoming: 0,
    overdue: 0
  })

  // Reminder UI State
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)

  // Reminder form state
  const [reminderForm, setReminderForm] = useState({
    reminder_title: '',
    reminder_type: 'Next health check',
    reminder_date: '',
    reminder_time: '',
    category: 'Health & appointments',
    notes: '',
    is_enabled: true,
    reminder_frequencies: {
      enabled_1_week: true,
      enabled_3_days: true,
      enabled_1_day: true
    }
  })

  // Reminder filters and sorting
  const [reminderFilters, setReminderFilters] = useState({
    category: '',
    reminder_type: '',
    is_enabled: undefined // undefined = show all reminders (enabled and disabled)
  })
  
  const [reminderSortBy, setReminderSortBy] = useState('reminder_date')
  const [reminderSortOrder, setReminderSortOrder] = useState('asc')
  const [selectedReminderCategory, setSelectedReminderCategory] = useState('all')

  // ============================================================================
  // END REMINDERS STATE
  // ============================================================================

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

        // Fetch full user profile including ic_number from users table
        const { data: userProfile, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userError || !userProfile) {
          // Fallback to auth user if profile not found
          setCurrentUser(user)
        } else {
          // Merge auth user with profile data
          setCurrentUser({ ...user, ...userProfile })
        }

        // Fetch health reports
        await fetchReports(user.id)

        // Check for alerts
        await checkAlerts(user.id)

        // Load reminders data
        await loadReminders(user.id)
        await loadReminderStats(user.id)
        await loadUpcomingReminders(user.id)
        await loadOverdueReminders(user.id)
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
  const fetchReports = useCallback(async (userId) => {
    try {
      const options = {
        searchKey: searchKey || undefined,
        reportType: filters.reportType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        healthReportStatus: filters.health_report_status || undefined,
        dueStatus: filters.dueStatus || undefined,
        providerName: filters.providerName || undefined,
        sortBy,
        sortOrder,
        showArchived: activeTab === 'archived' && userRole !== 'admin'
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
  }, [searchKey, filters, sortBy, sortOrder, activeTab, userRole])

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
  }, [currentUser, fetchReports])

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    setSearchKey('')
    if (currentUser) {
      fetchReports(currentUser.id)
    }
  }, [currentUser, fetchReports])

  // Handle filter
  const handleFilter = useCallback(() => {
    if (currentUser) {
      fetchReports(currentUser.id)
    }
  }, [currentUser, fetchReports])

  // Handle sort
  const handleSort = useCallback((field, order = null) => {
    if (order) {
      // Direct order setting
      setSortBy(field)
      setSortOrder(order)
    } else {
      // Toggle order (existing behavior)
      const newOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
      setSortBy(field)
      setSortOrder(newOrder)
    }
  }, [sortBy, sortOrder])

  // Apply sort, search, and filter changes
  useEffect(() => {
    if (currentUser) {
      fetchReports(currentUser.id)
    }
  }, [fetchReports, currentUser])

  // Client-side filtering for real-time search and filter functionality
  useEffect(() => {
    if (!reports || reports.length === 0) {
      setFilteredReports([])
      return
    }

    let filtered = reports.filter(report => {
      // Search filter - search across multiple fields
      if (searchKey && typeof searchKey === 'string' && searchKey.trim()) {
        const searchTerm = searchKey.toLowerCase().trim()
        const userHaystack = [
          report.userData?.full_name,
          report.userData?.email,
          report.userData?.ic_number,
          report.userData?.phone,
          report.user_full_name,
          report.user_email,
          report.ic_number,
          report.phone
        ]
        const matchesSearch = 
          (report.report_type && report.report_type.toLowerCase().includes(searchTerm)) ||
          (report.notes && report.notes.toLowerCase().includes(searchTerm)) ||
          (report.report_title && report.report_title.toLowerCase().includes(searchTerm)) ||
          (report.provider_name && report.provider_name.toLowerCase().includes(searchTerm)) ||
          userHaystack.some(val => val && val.toString().toLowerCase().includes(searchTerm))
        
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
        case 'pending':
          filtered = filtered.filter(r => r.health_report_status === 'Pending')
          break
        case 'reviewed':
          filtered = filtered.filter(r => r.health_report_status === 'Reviewed')
          break
        case 'flagged':
          filtered = filtered.filter(r => r.health_report_status === 'Flagged')
          break
        case 'archived':
          filtered = filtered.filter(r => r.health_report_status === 'Archived')
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
      setErrors({})
      
      // Get user's application ID if not provided in URL
      const finalApplicationId = applicationId || await getUserApplicationId(currentUser.id)

      // Validate form
      const validationErrors = {}
      
      if (!uploadForm.file) {
        validationErrors.file = 'Please select a file'
      }
      if (!uploadForm.reportType) {
        validationErrors.reportType = 'Please select report type'
      }
      if (!uploadForm.reportDate) {
        validationErrors.reportDate = 'Please select report date'
      } else {
        // Guard: report date must not be earlier than the user's birth date (server-side enforcement)
        const birthDateStr = deriveUserBirthDate(currentUser)
        const birthDate = birthDateStr ? new Date(birthDateStr) : null
        const reportDate = new Date(uploadForm.reportDate)

        if (!birthDate || Number.isNaN(birthDate.getTime())) {
          validationErrors.reportDate = 'Unable to validate birth date. Please update your profile.'
        } else if (Number.isNaN(reportDate.getTime())) {
          validationErrors.reportDate = 'Report date is invalid'
        } else if (reportDate < birthDate) {
          validationErrors.reportDate = 'Report date cannot be earlier than your birth date'
        }
      }
      
      if (!uploadForm.reportTitle) {
        validationErrors.reportTitle = 'Please enter report title'
      }
      if (!uploadForm.providerName) {
        validationErrors.providerName = 'Please enter healthcare provider name'
      }

      // If there are validation errors, set them and return
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        setIsUploading(false)
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
          reportTitle: uploadForm.reportTitle,
          providerName: uploadForm.providerName,
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
          reportTitle: '',
          providerName: '',
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
      
      // Get user's application ID if not provided in URL
      const finalApplicationId = applicationId || await getUserApplicationId(currentUser.id)

      const uploadResults = [];
      const healthReportRecords = [];

      // Validate all required fields first
      const validationErrors = {}

      // Determine report type
      const reportType = multiUploadForm.reportType === 'Others'
        ? multiUploadForm.customReportType
        : multiUploadForm.reportType;

      if (!multiUploadForm.reportType) {
        validationErrors.reportType = 'Please select a report type'
      } else if (multiUploadForm.reportType === 'Others' && !multiUploadForm.customReportType?.trim()) {
        validationErrors.customReportType = 'Please specify custom report type'
      }

      if (!multiUploadForm.reportDate) {
        validationErrors.reportDate = 'Please select a report date'
      } else {
        // Guard: report date must not be earlier than the user's birth date
        const birthDateStr = deriveUserBirthDate(currentUser)
        const birthDate = birthDateStr ? new Date(birthDateStr) : null
        const reportDate = new Date(multiUploadForm.reportDate)

        if (!birthDate || Number.isNaN(birthDate.getTime())) {
          validationErrors.reportDate = 'Unable to validate birth date. Please update your profile.'
        } else if (Number.isNaN(reportDate.getTime())) {
          validationErrors.reportDate = 'Report date is invalid'
        } else if (reportDate < birthDate) {
          validationErrors.reportDate = 'Report date cannot be earlier than your birth date'
        }
      }

      if (!multiUploadForm.reportTitle?.trim()) {
        validationErrors.reportTitle = 'Please enter report title'
      }

      if (!multiUploadForm.providerName?.trim()) {
        validationErrors.providerName = 'Please enter healthcare provider name'
      }

      // If there are validation errors, set them and return
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return {
          success: false,
          error: 'Please fill in all required fields correctly'
        }
      }

      // Clear any previous errors
      setErrors({})

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
          report_title: multiUploadForm.reportTitle,
          provider_name: multiUploadForm.providerName,
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

  // Handle share form change
  const handleShareFormChange = useCallback((field, value) => {
    setShareForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Load existing share links for the selected report
  const loadShareLinks = useCallback(async (reportId) => {
    if (!reportId) return

    try {
      setIsShareLinksLoading(true)
      const result = await getHealthReportShares(reportId)

      if (result.success) {
        const mappedShares = result.data.map((share) => ({
          ...share,
          shareUrl: `${window.location.origin}/shared-report/${share.share_token}`
        }))
        setShareLinks(mappedShares)
      } else {
        setShareLinks([])
      }
    } catch (err) {
      console.error('Error loading share links:', err)
      setShareLinks([])
    } finally {
      setIsShareLinksLoading(false)
    }
  }, [])

  // Copy helper used for generated links and existing links
  const copyShareLink = useCallback(async (shareUrl, successMsg = 'Shareable link copied to clipboard') => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setSuccessMessage(successMsg)
    } catch (clipboardErr) {
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand('copy')
        setSuccessMessage(successMsg)
      } catch (execErr) {
        setSuccessMessage('Link: ' + shareUrl)
      }

      document.body.removeChild(textArea)
    }
  }, [])

  const handleCopyShareLink = useCallback(async (shareUrl) => {
    await copyShareLink(shareUrl)
  }, [copyShareLink])

  // Handle share click
  const handleShareClick = useCallback((report) => {
    setSelectedReport(report)
    setError(null)
    setSuccessMessage(null)
    setShowShareModal(true)
    loadShareLinks(report?.id)
  }, [loadShareLinks])

  // Handle view all archived reports
  const handleViewAllArchived = useCallback(() => {
    setShowArchivedModal(true)
  }, [])

  // Handle share submit
  const handleShareSubmit = async () => {
    try {
      setError(null)

      if (!shareForm.shareOption) {
        setError('Please select a sharing option')
        return
      }

      // Use the shareHealthReport function for all sharing options
      const result = await shareHealthReport(
        selectedReport.id,
        shareForm.shareOption,
        shareForm
      )

      if (result.success) {
        if (result.action === 'download') {
          // Create download link and trigger download
          const link = document.createElement('a')
          link.href = result.url
          link.download = selectedReport.report_title || 'health-report'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          setSuccessMessage('Report download started')
        } else if (shareForm.shareOption === 'link' && result.data?.shareUrl) {
          await copyShareLink(result.data.shareUrl)
        } else {
          setSuccessMessage(result.message || 'Report shared successfully')
        }

        if (selectedReport?.id) {
          await loadShareLinks(selectedReport.id)
        }
      } else {
        setError(result.error)
        return
      }

      setShareForm({
        shareOption: '',
        caregiverId: '',
        familyMemberId: '',
        providerEmail: '',
        email: '',
        expiryDays: 7
      })
    } catch (err) {
      console.error('Error sharing report:', err)
      setError('Failed to share health report')
    }
  }

  // Revoke an existing share link
  const handleRevokeShareLink = async (shareId) => {
    if (!shareId) return

    try {
      const result = await revokeHealthReportShare(shareId)

      if (result.success) {
        setSuccessMessage('Share link revoked')

        if (selectedReport?.id) {
          await loadShareLinks(selectedReport.id)
        }
      } else {
        setError(result.error || 'Failed to revoke share link')
      }
    } catch (err) {
      console.error('Error revoking share link:', err)
      setError('Failed to revoke share link')
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
    setShowPDFViewer(false)
    setViewingReportUrl(null)
    setSelectedReport(null)
    setShareLinks([])
    setIsShareLinksLoading(false)
    setUploadForm({
      reportType: '',
      reportDate: '',
      reportTitle: '',
      providerName: '',
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
        pending: reports.filter(r => !r.health_report_status || r.health_report_status?.toLowerCase() === 'pending').length,
        reviewed: reports.filter(r => r.health_report_status?.toLowerCase() === 'reviewed').length,
        flagged: reports.filter(r => r.health_report_status?.toLowerCase() === 'flagged').length
      }
      setStatistics(stats)
    } else {
      setStatistics({
        reminderThisWeek: 0,
        overdueHealthReport: 0,
        healthReportDueSoon: 0,
        pending: 0,
        reviewed: 0,
        flagged: 0
      })
    }
  }, [reports])

  // ============================================================================
  // REMINDERS FUNCTIONALITY
  // ============================================================================

  // Load all reminders for the user
  const loadReminders = useCallback(async (userId = currentUser?.id) => {
    if (!userId) return

    try {
      const result = await RemindersService.getUserReminders(userId, {
        ...reminderFilters,
        orderBy: reminderSortBy,
        order: reminderSortOrder
      })
      if (result.success) {
        setReminders(result.data)
      } else {
        console.error('Error loading reminders:', result.error)
      }
    } catch (error) {
      console.error('Error loading reminders:', error)
    }
  }, [currentUser?.id, reminderFilters, reminderSortBy, reminderSortOrder])

  // Load reminder statistics
  const loadReminderStats = useCallback(async (userId = currentUser?.id) => {
    if (!userId) return

    try {
      const result = await RemindersService.getReminderStatistics(userId)
      if (result.success) {
        setReminderStats(result.data)
      } else {
        console.error('Error loading reminder stats:', result.error)
      }
    } catch (error) {
      console.error('Error loading reminder stats:', error)
    }
  }, [currentUser?.id])

  // Load upcoming reminders
  const loadUpcomingReminders = useCallback(async (userId = currentUser?.id, category = selectedReminderCategory) => {
    if (!userId) return

    try {
      const result = await RemindersService.getUpcomingReminders(userId)
      if (result.success) {
        // Apply category filter if selected
        const filteredData = category === 'all'
          ? result.data
          : result.data.filter(reminder => reminder.category === category)
        setUpcomingReminders(filteredData)
      } else {
        console.error('Error loading upcoming reminders:', result.error)
      }
    } catch (error) {
      console.error('Error loading upcoming reminders:', error)
    }
  }, [currentUser?.id, selectedReminderCategory])

  // Load overdue reminders
  const loadOverdueReminders = useCallback(async (userId = currentUser?.id, category = selectedReminderCategory) => {
    if (!userId) return

    try {
      const result = await RemindersService.getOverdueReminders(userId)
      if (result.success) {
        // Apply category filter if selected
        const filteredData = category === 'all'
          ? result.data
          : result.data.filter(reminder => reminder.category === category)
        setOverdueReminders(filteredData)
      } else {
        console.error('Error loading overdue reminders:', result.error)
      }
    } catch (error) {
      console.error('Error loading overdue reminders:', error)
    }
  }, [currentUser?.id, selectedReminderCategory])

  // Handle reminder form changes
  const handleReminderFormChange = useCallback((field, value) => {
    setReminderForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // Handle reminder filter changes
  const handleReminderFilterChange = useCallback((newFilters) => {
    setReminderFilters(newFilters)
  }, [])

  // Handle reminder sort changes
  const handleReminderSort = useCallback((field, order = null) => {
    if (order) {
      setReminderSortBy(field)
      setReminderSortOrder(order)
    } else {
      // Toggle sort order if same field
      const newOrder = reminderSortBy === field && reminderSortOrder === 'asc' ? 'desc' : 'asc'
      setReminderSortBy(field)
      setReminderSortOrder(newOrder)
    }
  }, [reminderSortBy, reminderSortOrder])

  // Handle reminder category filter
  const handleReminderCategoryFilter = useCallback((category) => {
    setSelectedReminderCategory(category)

    // Reload upcoming and overdue reminders, passing the new category directly
    // since setSelectedReminderCategory hasn't taken effect yet on this render
    loadUpcomingReminders(currentUser?.id, category)
    loadOverdueReminders(currentUser?.id, category)
  }, [currentUser?.id, loadUpcomingReminders, loadOverdueReminders])

  // Open reminder modal for creation
  const handleCreateReminder = useCallback(() => {
    setEditingReminder(null)
    setError(null)
    setSuccessMessage(null)
    setErrors({})
    setReminderForm({
      reminder_title: '',
      reminder_type: 'Next health check',
      reminder_date: '',
      reminder_time: '',
      category: 'Health & appointments',
      notes: '',
      is_enabled: true,
      reminder_frequencies: {
        enabled_1_week: true,
        enabled_3_days: true,
        enabled_1_day: true
      }
    })
    setShowReminderModal(true)
  }, [])

  // Open reminder modal for editing
  const handleEditReminder = useCallback((reminder) => {
    setEditingReminder(reminder)
    setError(null)
    setSuccessMessage(null)
    setErrors({})
    
    // Parse date and time from reminder_date
    const reminderDate = new Date(reminder.reminder_date)
    const dateStr = reminderDate.toISOString().split('T')[0]
    const timeStr = reminderDate.toTimeString().slice(0, 5)
    
    setReminderForm({
      reminder_title: reminder.reminder_title,
      reminder_type: reminder.reminder_type,
      reminder_date: dateStr,
      reminder_time: timeStr,
      category: reminder.category,
      notes: reminder.notes || '',
      // Reflect existing data; default only applies to creation
      is_enabled: reminder.is_enabled ?? false,
      reminder_frequencies: {
        enabled_1_week: reminder.reminder_frequencies?.enabled_1_week ?? false,
        enabled_3_days: reminder.reminder_frequencies?.enabled_3_days ?? false,
        enabled_1_day: reminder.reminder_frequencies?.enabled_1_day ?? false
      }
    })
    setShowReminderModal(true)
  }, [])

  // Submit reminder form (create or update)
  const handleSubmitReminder = useCallback(async () => {
    if (!currentUser?.id) return

    // Clear previous messages
    setError(null)
    setSuccessMessage(null)
    setErrors({})

    try {
      // Validate required fields
      const validationErrors = {}
      
      if (!reminderForm.reminder_title || reminderForm.reminder_title.trim() === '') {
        validationErrors.reminder_title = 'Please enter a reminder title'
      }
      if (!reminderForm.reminder_type || reminderForm.reminder_type.trim() === '') {
        validationErrors.reminder_type = 'Please select a reminder type'
      }
      if (!reminderForm.reminder_date || reminderForm.reminder_date.trim() === '') {
        validationErrors.reminder_date = 'Please select a reminder date'
      }
      if (!reminderForm.reminder_time || reminderForm.reminder_time.trim() === '') {
        validationErrors.reminder_time = 'Please enter a valid reminder time'
      }
      if (!reminderForm.category || reminderForm.category.trim() === '') {
        validationErrors.category = 'Please select a category'
      }
      if (reminderForm.is_enabled && !(reminderForm.reminder_frequencies.enabled_1_week || reminderForm.reminder_frequencies.enabled_3_days || reminderForm.reminder_frequencies.enabled_1_day)) {
        validationErrors.reminder_frequencies = 'Please enable at least one reminder frequency'
      }

      // Combine date and time for further validation
      if (!validationErrors.reminder_date && !validationErrors.reminder_time) {
        const reminderDateTime = new Date(`${reminderForm.reminder_date}T${reminderForm.reminder_time}`)

        if (reminderDateTime < new Date()) {
          validationErrors.reminder_date = 'Reminder date and time cannot be in the past'
        }
        if (reminderDateTime > new Date(new Date().setFullYear(new Date().getFullYear() + 5))) {
          validationErrors.reminder_date = 'Reminder date is too far in the future'
        }
      }

      // If there are validation errors, set them and return
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      // All validations passed
      const reminderDateTime = new Date(`${reminderForm.reminder_date}T${reminderForm.reminder_time}`)

      // All validations passed, show loading state
      setIsLoading(true)
      
      const reminderData = {
        user_id: currentUser.id,
        reminder_title: reminderForm.reminder_title,
        reminder_type: reminderForm.reminder_type,
        reminder_date: reminderDateTime,
        category: reminderForm.category,
        notes: reminderForm.notes,
        is_enabled: reminderForm.is_enabled,
        reminder_frequencies: reminderForm.reminder_frequencies
      }

      let result
      if (editingReminder) {
        // Update existing reminder
        result = await RemindersService.updateReminder(editingReminder.id, reminderData)
      } else {
        // Create new reminder
        result = await RemindersService.createReminder(reminderData)
      }

      if (result.success) {
        // For updates, data might be null, so we use the existing reminder ID
        const reminderId = editingReminder ? editingReminder.id : result.data?.id

        // Create reminder notifications for each enabled frequency
        if (!editingReminder && reminderForm.reminder_frequencies) {
          const frequencies = []

          // Add 1 week before reminder
          if (reminderForm.reminder_frequencies.enabled_1_week) {
            const weekBefore = new Date(reminderDateTime)
            weekBefore.setDate(weekBefore.getDate() - 7)
            frequencies.push({
              reminder_id: reminderId,
              scheduled_time: weekBefore.toISOString(),
              notification_offset: '1 week'
            })
          }

          // Add 1 day before reminder
          if (reminderForm.reminder_frequencies.enabled_1_day) {
            const dayBefore = new Date(reminderDateTime)
            dayBefore.setDate(dayBefore.getDate() - 1)
            frequencies.push({
              reminder_id: reminderId,
              scheduled_time: dayBefore.toISOString(),
              notification_offset: '1 day'
            })
          }

          // Add 3 days before reminder
          if (reminderForm.reminder_frequencies.enabled_3_days) {
            const threeDaysBefore = new Date(reminderDateTime)
            threeDaysBefore.setDate(threeDaysBefore.getDate() - 3)
            frequencies.push({
              reminder_id: reminderId,
              scheduled_time: threeDaysBefore.toISOString(),
              notification_offset: '3 days'
            })
          }

          // Create reminder notifications in database
          for (const freq of frequencies) {
            try {
              await supabase
                .from('reminder_notifications')
                .insert({
                  ...freq,
                  is_sent: false
                })
            } catch (err) {
              console.error('Error creating reminder notification:', err)
            }
          }

          // Trigger reminder processor; the deployed function only
          // processes notifications on its /run route.
          // Fire-and-forget: don't block the UI on this (can be slow on cold start)
          // since the reminder and its notifications are already saved above.
          corsProxyFunctionInvoke('reminder-processor/run', { action: 'run' }).catch(err => {
            console.error('Error invoking reminder processor function:', err)
          })
        }

        // Set success message
        const message = editingReminder ? 'Reminder updated successfully' : 'Reminder created successfully'
        setSuccessMessage(message)
        
        // Reload reminders data
        loadReminders()
        loadReminderStats()
        loadUpcomingReminders()
        loadOverdueReminders()
        
        // Close modal after a brief delay to allow users to see the success message
        setTimeout(() => {
          setShowReminderModal(false)
          
          // Reset reminder form
          setReminderForm({
            reminder_title: '',
            reminder_type: 'Next health check',
            reminder_date: '',
            reminder_time: '',
            category: 'Health & appointments',
            notes: '',
            is_enabled: true,
            reminder_frequencies: {
              enabled_1_week: true,
              enabled_3_days: true,
              enabled_1_day: true
            }
          })
        }, 800)
      } else {
        setError(result.error || 'Failed to save reminder')
      }
    } catch (error) {
      console.error('Error saving reminder:', error)
      setError('Failed to save reminder')
    } finally {
      setIsLoading(false)
    }
  }, [currentUser?.id, reminderForm, editingReminder, loadReminders, loadReminderStats, loadUpcomingReminders, loadOverdueReminders])

  // Delete reminder
  const handleDeleteReminder = useCallback(async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return

    try {
      const result = await RemindersService.deleteReminder(reminderId)
      if (result.success) {
        setSuccessMessage('Reminder deleted successfully')
        loadReminders()
        loadReminderStats()
        loadUpcomingReminders()
        loadOverdueReminders()
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Error deleting reminder:', error)
      setError('Failed to delete reminder')
    }
  }, [loadReminders, loadReminderStats, loadUpcomingReminders, loadOverdueReminders])

  // Toggle reminder enabled status
  const handleToggleReminder = useCallback(async (reminderId, isEnabled) => {
    try {
      const result = await RemindersService.toggleReminder(reminderId, isEnabled)
      if (result.success) {
        setSuccessMessage(`Reminder ${isEnabled ? 'enabled' : 'disabled'} successfully`)
        loadReminders()
        loadReminderStats()
        loadUpcomingReminders()
        loadOverdueReminders()
      } else {
        setError(result.error)
      }
    } catch (error) {
      console.error('Error toggling reminder:', error)
      setError('Failed to update reminder')
    }
  }, [loadReminders, loadReminderStats, loadUpcomingReminders, loadOverdueReminders])

  // Mark reminder as notified
  const handleMarkAsNotified = useCallback(async (reminderId) => {
    try {
      const result = await RemindersService.markAsNotified(reminderId)
      if (result.success) {
        loadReminders()
        loadUpcomingReminders()
        loadOverdueReminders()
      } else {
        console.error('Error marking reminder as notified:', result.error)
      }
    } catch (error) {
      console.error('Error marking reminder as notified:', error)
    }
  }, [loadReminders, loadUpcomingReminders, loadOverdueReminders])

  // Cancel reminder modal
  const handleCancelReminderModal = useCallback(() => {
    setShowReminderModal(false)
    setEditingReminder(null)
    setErrors({})
    setReminderForm({
      reminder_title: '',
      reminder_type: 'Next health check',
      reminder_date: '',
      reminder_time: '',
      category: 'Health & appointments',
      notes: '',
      is_enabled: true,
      reminder_frequencies: {
        enabled_1_week: true,
        enabled_3_days: true,
        enabled_1_day: true
      }
    })
  }, [])

  // ============================================================================
  // END REMINDERS FUNCTIONALITY
  // ============================================================================

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

  const handleClosePDFViewer = useCallback(() => {
    setShowPDFViewer(false)
    setViewingReportUrl(null)
    setViewingReport(null)
  }, [])

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    if (currentUser) {
      fetchReports(currentUser.id)
    }
  }, [currentUser])

  const handleViewReport = useCallback((reportId) => {
    // Find the report to view
    const report = reports.find(r => r.id === reportId)
    if (report && report.report_file_url) {
      // Show the report in overlay modal
      setViewingReportUrl(report.report_file_url)
      setViewingReport(report)
      setShowPDFViewer(true)
    } else {
      setError('Report file not found or URL is invalid')
    }
  }, [reports])

  const handleReuploadReport = useCallback(async (reportId) => {
    try {
      // Create a file input for the user to select a new file
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.accept = '.pdf,.jpg,.jpeg,.png,.webp' // Accept multiple file types
      
      fileInput.onchange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) {
          return
        }

        setError(null) // Clear any previous errors

        try {
          // Validate file
          const validation = await validateHealthReportFile(file)
          
          if (!validation.valid) {
            setError(`Invalid file: ${validation.error}`)
            return
          }

          let processedFile = file

          // Convert image to PDF if needed
          if (isImageFile(file)) {
            const fileName = `health_report_reupload_${Date.now()}.pdf`
            processedFile = await convertImagesToPDF([file], fileName)
          }

          // Process PDF (compress, validate, repair if needed)
          if (isPDFFile(processedFile)) {
            const processResult = await processPDF(processedFile, {
              compress: true,
              compressionLevel: 0.8,
              maxFileSize: 5 * 1024 * 1024 // 5MB
            })
            
            if (processResult.success) {
              processedFile = processResult.file
            }
          }

          // Store file data and show confirmation dialog
          const filePreview = {
            name: file.name,
            size: processedFile.size,
            type: processedFile.type,
            file: processedFile,
            originalFile: file
          }

          setReuploadFileData(filePreview)
          setReuploadReportId(reportId)
          setShowReuploadConfirm(true)
        } catch (error) {
          setError(error.message || 'An error occurred while processing the file. Please try again.')
        }
      }

      // Add error handler for file input
      fileInput.onerror = (error) => {
        setError('Failed to open file selector. Please try again.')
      }

      // Trigger file selection
      fileInput.click()
    } catch (error) {
      setError('Failed to initiate file selection. Please try again.')
    }
  }, [])

  // Handle reupload confirmation
  const handleReuploadConfirm = useCallback(async () => {
    if (!reuploadFileData || !reuploadReportId) return

    try {
      setIsUploading(true)
      setUploadProgress(0)
      setError(null)
      setShowReuploadConfirm(false)

      // Upload the new file
      const uploadResult = await uploadHealthReportFile(
        reuploadFileData.file,
        currentUser.id,
        'health_report',
        {
          signedUrlDuration: 31536000 // 1 year
        }
      )

      if (uploadResult.error) {
        setError(`Failed to reupload file: ${uploadResult.error.message}`)
        setIsUploading(false)
        return
      }

      const result = await reuploadHealthReport(
        reuploadReportId,
        uploadResult.url,
        { status: 'Pending' }
      )

      if (!result.success) {
        setError(result.error || 'File uploaded but failed to save record to database. Please contact support.')
        setIsUploading(false)
        return
      }

      // Close PDF viewer
      handleClosePDFViewer()

      // Refresh reports and alerts
      await fetchReports(currentUser.id)
      await checkAlerts(currentUser.id)

      // Show success message
      setSuccessMessage('Document reuploaded successfully. The report has been reset for re-review.')

      // Clear reupload state
      setReuploadFileData(null)
      setReuploadReportId(null)
    } catch (error) {
      setError(error.message || 'An unexpected error occurred during reupload. Please try again.')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [reuploadFileData, reuploadReportId, currentUser, handleClosePDFViewer, fetchReports, checkAlerts])

  // Handle reupload cancel
  const handleReuploadCancel = useCallback(() => {
    setShowReuploadConfirm(false)
    setReuploadFileData(null)
    setReuploadReportId(null)
    setError(null)
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
      healthReportStatus: '',
      dueStatus: '',
      providerName: ''
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
      showReuploadConfirm={showReuploadConfirm}
      reuploadFileData={reuploadFileData}
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
      showArchivedModal={showArchivedModal}
      isUploading={isUploading}
      uploadProgress={uploadProgress}
      showShareModal={showShareModal}
      showUploadModal={showUploadModal}
      showPDFViewer={showPDFViewer}
      viewingReportUrl={viewingReportUrl}
      viewingReport={viewingReport}
      errors={errors}

      // Filter and sort
      searchKey={searchKey}
      filters={filters}
      sortBy={sortBy}
      sortOrder={sortOrder}

      // Forms
      uploadForm={uploadForm}
      shareForm={shareForm}
      shareLinks={shareLinks}
      isShareLinksLoading={isShareLinksLoading}
      multiUploadForm={multiUploadForm}

      // Handlers
      onSearchChange={setSearchKey}
      onFilterChange={handleFilterChange}
      onClearFilters={handleClearFilters}
      onTabFilter={handleTabFilter}
      onAdminSort={handleSort}
      onReportSelect={handleReportSelect}
      onSearch={handleSearch}
      onClearSearch={handleClearSearch}
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
      onCopyShareLink={handleCopyShareLink}
      onRevokeShareLink={handleRevokeShareLink}
      onDelete={handleDelete}
      onCancel={handleCancel}
      onExit={handleExit}
      onUploadClick={() => setShowUploadModal(true)}
      onCancelUploadModal={handleCancel}
      onCancelShareModal={handleCancel}
      onViewAllArchived={handleViewAllArchived}
      onCloseArchivedModal={() => setShowArchivedModal(false)}
      onClosePDFViewer={handleClosePDFViewer}
      showFilters={showFilters}
      showSort={showSort}
      onSetShowFilters={(value) => setShowFilters(!showFilters)}
      onSetShowSort={(value) => setShowSort(!showSort)}
      onSort={handleSort}
      onDownload={(reportId) => handleViewReport(reportId)}
      onReuploadReport={handleReuploadReport}
      onReuploadConfirm={handleReuploadConfirm}
      onReuploadCancel={handleReuploadCancel}
      applicationId={applicationId}

      // Reminders data
      reminders={reminders}
      upcomingReminders={upcomingReminders}
      overdueReminders={overdueReminders}
      reminderStats={reminderStats}
      reminderTypes={REMINDER_TYPES}
      reminderCategories={REMINDER_CATEGORIES}

      // Reminder UI state
      showReminderModal={showReminderModal}
      editingReminder={editingReminder}

      // Reminder form state
      reminderForm={reminderForm}
      reminderFilters={reminderFilters}
      reminderSortBy={reminderSortBy}
      reminderSortOrder={reminderSortOrder}
      selectedReminderCategory={selectedReminderCategory}

      // Reminder handlers
      onCreateReminder={handleCreateReminder}
      onEditReminder={handleEditReminder}
      onDeleteReminder={handleDeleteReminder}
      onToggleReminder={handleToggleReminder}
      onMarkAsNotified={handleMarkAsNotified}
      onSubmitReminder={handleSubmitReminder}
      onCancelReminderModal={handleCancelReminderModal}
      onReminderFormChange={handleReminderFormChange}
      onReminderFilterChange={handleReminderFilterChange}
      onReminderSort={handleReminderSort}
      onReminderCategoryFilter={handleReminderCategoryFilter}

      // Reminder methods
      loadReminders={loadReminders}
      loadReminderStats={loadReminderStats}
      loadUpcomingReminders={loadUpcomingReminders}
      loadOverdueReminders={loadOverdueReminders}
    />
  )
}

export default HealthReportController
