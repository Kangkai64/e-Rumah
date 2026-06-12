// src/controllers/CustomerSupportController.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../client_controller/sessionController/AuthContext'
import Inquiry from '../models/Inquiry'
import Nominee from '../models/Nominee'
import Application from '../models/Application'
import SupportConversation from '../models/SupportConversation'
import HealthReport from '../models/HealthReport'
import CustomerSupportView from '../views/CustomerSupportView'
import { getCompanyContactInfo, setCompanyContactInfo } from '../services/settingsService'

export default function CustomerSupportController() {
  const { user } = useAuth()

  // 1. State Management
  const [activeTab, setActiveTab] = useState('inquiries') // inquiries | nominees | healthReports
  const [inquiries, setInquiries] = useState([])
  const [nominees, setNominees] = useState([])
  const [healthReports, setHealthReports] = useState([])
  const [selectedItem, setSelectedItem] = useState(null) // Currently selected item
  const [selectedNominees, setSelectedNominees] = useState([]) // Nominees of the currently selected item
  const [conversations, setConversations] = useState([]) // Conversations (all tabs)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterField, setFilterField] = useState('status') // Filter field: status | priority
  const [filterValue, setFilterValue] = useState('') // Filter value
  const [sortBy, setSortBy] = useState('latest') // Sort method

  // Contact Settings State
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactLoading, setContactLoading] = useState(false)
  const [contactError, setContactError] = useState('')
  const [contactSuccess, setContactSuccess] = useState('')

  // 3. Load Contact Settings
  useEffect(() => {
    // Load from localStorage on mount
    const { email, phone } = getCompanyContactInfo()
    setContactEmail(email)
    setContactPhone(phone)

    // Listen for changes from other tabs
    const handleStorage = (e) => {
      if (e.key === 'companyContactEmail' || e.key === 'companyContactPhone') {
        const { email, phone } = getCompanyContactInfo()
        setContactEmail(email)
        setContactPhone(phone)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // 4. Save Contact Settings
  const handleSaveContactSettings = () => {
    // Validate
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contactEmail)) {
      setContactError('Please enter a valid email address')
      return
    }

    const phoneRegex = /^0\d{1,3}[\s\-]?\d{3,4}[\s\-]?\d{4}$/
    if (!phoneRegex.test(contactPhone.replace(/\s/g, ''))) {
      setContactError('Please enter a valid phone number (e.g., 03-1112 9429)')
      return
    }

    setContactLoading(true)
    setContactError('')
    setContactSuccess('')

    try {
      setCompanyContactInfo({ email: contactEmail, phone: contactPhone })
      setContactSuccess('Contact settings updated successfully!')
      setTimeout(() => setContactSuccess(''), 3000)
    } catch (error) {
      console.error('Error saving contact settings:', error)
      setContactError('Failed to update contact settings. Please try again.')
    } finally {
      setContactLoading(false)
    }
  }

  // 5. Fetch Data
  useEffect(() => {
    let mounted = true
    fetchData(mounted)
    return () => { mounted = false }
  }, [activeTab, filterField, filterValue])

  const fetchData = useCallback(async (mounted = true) => {
    setLoading(true)
    try {
      if (activeTab === 'inquiries') {
        // Filter by subject = 'inquiries'
        const filters = { subject: 'inquiries' }
        if (filterValue) {
          filters[filterField] = filterValue // e.g., { status: 'pending' } or { priority: 'high' }
        }
        
        const { data, success } = await Inquiry.getAll(filters)
        console.log('Fetched inquiries:', data) // Debug log
        // Add displayText to show message content instead of subject
        if (success && mounted) {
          const formattedData = data?.map(item => ({
            ...item,
            displayText: item.message || item.subject
          }))
          setInquiries(formattedData || [])
        }
      } else if (activeTab === 'nominees') {
        // Filter by subject = 'nominee'
        const filters = { subject: 'nominee' }
        if (filterValue) {
          filters[filterField] = filterValue
        }
        
        const { data, success } = await Inquiry.getAll(filters)
        console.log('Fetched nominees:', data) // Debug log
        // Add displayText to show message content instead of subject
        if (success && mounted) {
          const formattedData = data?.map(item => ({
            ...item,
            displayText: item.message || item.subject
          }))
          setNominees(formattedData || [])
        }
      } else if (activeTab === 'healthReports') {
        // Fetch both health report inquiries AND flagged health reports
        const filters = { subject: 'health_report' }
        if (filterValue) {
          filters[filterField] = filterValue
        }
        
        // Fetch inquiries
        const { data: inquiryData, success: inquirySuccess } = await Inquiry.getAll(filters)
        
        // Fetch flagged health reports
        const { data: flaggedData, success: flaggedSuccess } = await HealthReport.getFlagged()
        
        // Merge both types
        let combinedData = []
        
        if (inquirySuccess && inquiryData) {
          // Add type field to inquiries
          combinedData = inquiryData.map(item => ({
            ...item,
            type: 'inquiry',
            // Use message content (not subject) to match other inquiry tabs
            displayText: item.message || item.subject
          }))
        }
        
        if (flaggedSuccess && flaggedData) {
          // Add type field to flagged reports
          const flaggedItems = flaggedData.map(item => ({
            ...item,
            type: 'flagged_report',
            // Use report_title as the "inquiry" column text
            displayText: item.report_title || 'Health Report',
            // Map status to match inquiry status format for filtering
            status: 'open' // Flagged reports are always "open" until resolved
          }))
          combinedData = [...combinedData, ...flaggedItems]
        }
        
        // Sort by date (most recent first)
        combinedData.sort((a, b) => {
          const dateA = new Date(a.created_at || a.report_date)
          const dateB = new Date(b.created_at || b.report_date)
          return dateB - dateA
        })
        
        console.log('Fetched health reports (combined):', combinedData) // Debug log
        if (mounted) setHealthReports(combinedData)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      if (mounted) setLoading(false)
    }
  }, [activeTab, filterField, filterValue])

  // 3. Switch Tab
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSelectedItem(null) // Clear selected item
    setSelectedNominees([]) // Clear nominees
    setConversations([])
    setSearchTerm('')
    setFilterField('status')
    setFilterValue('')
  }

  // 4. Select Item (Show Details)
  const handleSelectItem = async (item) => {
    setSelectedItem(item)
    setConversations([]) // Clear previous conversations
    setSelectedNominees([]) // Clear previous nominees
    
    if (!item.id) return
    
    // Load nominees if in nominees or healthReports tab
    if ((activeTab === 'nominees' || activeTab === 'healthReports') && item.user_id) {
      const { data: nomineesData, success: nomineesSuccess } = await Nominee.getByUserId(item.user_id)
      if (nomineesSuccess) {
        setSelectedNominees(nomineesData || [])
      }
    }
    
    // Load conversations - unified use of SupportConversation
    let entityType = ''
    if (activeTab === 'inquiries') entityType = 'inquiry'
    else if (activeTab === 'nominees') entityType = 'nominee'
    else if (activeTab === 'healthReports') entityType = 'health_report'
    
    if (entityType) {
      const { data, success } = await SupportConversation.getByEntity(entityType, item.id)
      if (success) setConversations(data || [])
    }
  }

  // Subscribe to real-time conversation updates when a chat is open
  useEffect(() => {
    if (!selectedItem?.id) return

    // Determine entity type
    let entityType = ''
    if (activeTab === 'inquiries') entityType = 'inquiry'
    else if (activeTab === 'nominees') entityType = 'nominee'
    else if (activeTab === 'healthReports') entityType = 'health_report'

    if (!entityType) return

    // Subscribe to real-time updates
    const subscription = SupportConversation.subscribeToConversations(
      entityType,
      selectedItem.id,
      (newConversation) => {
        // Add new conversation to the list
        setConversations((prev) => {
          // Check if conversation already exists to avoid duplicates
          const exists = prev.some(conv => conv.id === newConversation.id)
          if (exists) return prev
          return [...prev, newConversation]
        })
      }
    )

    // Cleanup subscription on unmount or when selectedItem changes
    return () => {
      if (subscription) {
        SupportConversation.unsubscribeFromConversations(subscription)
      }
    }
  }, [selectedItem?.id, activeTab])

  // 5. Send Reply
  const handleSendReply = async (message) => {
    if (!selectedItem || !message.trim()) return { success: false }
    if (!user?.id) return { success: false, error: 'Not authenticated' }

    try {
      const currentUserId = user.id
      
      // Determine entity type
      let entityType = ''
      if (activeTab === 'inquiries') entityType = 'inquiry'
      else if (activeTab === 'nominees') entityType = 'nominee'
      else if (activeTab === 'healthReports') entityType = 'health_report'
      
      if (!entityType) return { success: false, error: 'Unknown entity type' }

      const { success, data } = await SupportConversation.send(
        entityType,
        selectedItem.id,
        message,
        'staff',
        currentUserId
      )

      if (success) {
        // Refresh conversation list
        const { data: updatedConversations } = await SupportConversation.getByEntity(entityType, selectedItem.id)
        setConversations(updatedConversations || [])
        
        // Update inquiry status to in_progress (only for inquiries, not flagged reports)
        // Works for all tabs: Inquiries, Nominees, and Health Reports (inquiry type)
        if (selectedItem.type !== 'flagged_report' && selectedItem.status === 'open') {
          await Inquiry.updateStatus(selectedItem.id, 'in_progress')
          
          // Update state based on active tab
          if (activeTab === 'inquiries') {
            setInquiries(prev => prev.map(inq => 
              inq.id === selectedItem.id 
                ? { ...inq, status: 'in_progress' }
                : inq
            ))
          } else if (activeTab === 'nominees') {
            setNominees(prev => prev.map(nom => 
              nom.id === selectedItem.id 
                ? { ...nom, status: 'in_progress' }
                : nom
            ))
          } else if (activeTab === 'healthReports') {
            setHealthReports(prev => prev.map(hr => 
              hr.id === selectedItem.id 
                ? { ...hr, status: 'in_progress' }
                : hr
            ))
          }
          
          setSelectedItem(prev => prev ? { ...prev, status: 'in_progress' } : prev)
        }
        
        return { success: true }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      return { success: false, error }
    }
  }

  // 6. Search Function
  const searchTimerRef = useRef(null)
  const handleSearch = (term) => {
    setSearchTerm(term)

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)

    // debounce 350ms
    searchTimerRef.current = setTimeout(async () => {
      if (!term.trim()) {
        fetchData()
        return
      }

      setLoading(true)
      try {
        if (activeTab === 'inquiries') {
          const { data, success } = await Inquiry.search(term)
          if (success) setInquiries(data || [])
        } else if (activeTab === 'nominees') {
          const { data, success } = await Nominee.search(term)
          if (success) setNominees(data || [])
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }, 350)
  }

  // 7. Filter Function
  const handleFilterFieldChange = (field) => {
    setFilterField(field)
    setFilterValue('') // Reset value when field changes
  }

  const handleFilterValueChange = (value) => {
    setFilterValue(value)
  }

  // 8. Sort Function
  const handleSortChange = (sort) => {
    setSortBy(sort)
  }

  // 9. Update Status (Review/Resolve)
  const handleUpdateStatus = async (id, status, internalNote = null) => {
    try {
      if (activeTab === 'inquiries') {
        const { success } = await Inquiry.updateStatus(id, status, internalNote)
        if (success) {
          fetchData() // Refresh list
          if (selectedItem?.id === id) {
            const updatedItem = { ...selectedItem, status }
            if (internalNote !== null) {
              updatedItem.internal_note = internalNote
            }
            setSelectedItem(updatedItem)
          }
          return { success: true }
        }
      } else if (activeTab === 'nominees' || activeTab === 'healthReports') {
        const { success } = await Inquiry.updateStatus(id, status, internalNote)
        if (success) {
          fetchData()
          if (selectedItem?.id === id) {
            const updatedItem = { ...selectedItem, status }
            if (internalNote !== null) {
              updatedItem.internal_note = internalNote
            }
            setSelectedItem(updatedItem)
          }
          return { success: true }
        }
      }
      return { success: false }
    } catch (error) {
      console.error('Failed to update status:', error)
      return { success: false, error: error.message }
    }
  }

  // 9.5 Flag application (for nominees/health reports)
  const handleFlagApplication = async (reason, flaggedCode) => {
    if (!selectedItem?.user_id || !reason.trim() || !flaggedCode) {
      return { success: false, error: 'Missing user ID, reason, or flagged code' }
    }

    try {
      const currentUserId = user?.id
      if (!currentUserId) return { success: false, error: 'Not authenticated' }
      const result = await Application.flagByUserId(
        selectedItem.user_id,
        reason,
        flaggedCode,
        currentUserId
      )

      if (result.success) {
        // Refresh the data to show updated status
        await fetchData()
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Failed to flag application:', error)
      return { success: false, error: error.message }
    }
  }

  // 10. Get Current Data (Including Sorting)
  const getCurrentData = () => {
    let data = []
    switch (activeTab) {
      case 'inquiries':
        data = inquiries
        break
      case 'nominees':
        data = nominees
        break
      case 'healthReports':
        data = healthReports
        break
      default:
        data = []
    }

    // Apply sorting
    const sorted = [...data]
    if (sortBy === 'latest') {
      sorted.sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at)
      })
    } else if (sortBy === 'oldest') {
      sorted.sort((a, b) => {
        return new Date(a.created_at) - new Date(b.created_at)
      })
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => {
        const nameA = a.user?.full_name || a.elder?.full_name || ''
        const nameB = b.user?.full_name || b.elder?.full_name || ''
        return nameA.localeCompare(nameB)
      })
    }

    return sorted
  }

  // 11. Render View
  return (
    <CustomerSupportView
      activeTab={activeTab}
      onTabChange={handleTabChange}
      data={getCurrentData()}
      selectedItem={selectedItem}
      selectedNominees={selectedNominees}
      onSelectItem={handleSelectItem}
      conversations={conversations}
      onSendReply={handleSendReply}
      onUpdateStatus={handleUpdateStatus}
      onFlagApplication={handleFlagApplication}
      loading={loading}
      searchTerm={searchTerm}
      onSearch={handleSearch}
      filterField={filterField}
      filterValue={filterValue}
      onFilterFieldChange={handleFilterFieldChange}
      onFilterValueChange={handleFilterValueChange}
      sortBy={sortBy}
      onSortChange={handleSortChange}
      contactEmail={contactEmail}
      contactPhone={contactPhone}
      onContactEmailChange={setContactEmail}
      onContactPhoneChange={setContactPhone}
      onSaveContactSettings={handleSaveContactSettings}
      contactLoading={contactLoading}
      contactError={contactError}
      contactSuccess={contactSuccess}
    />
  )
}