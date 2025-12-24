// src/controllers/UserSupportController.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../client_controller/sessionController/AuthContext'
import UserSupport from '../models/UserSupport'
import UserSupportView from '../views/UserSupportView'
import { getCompanyContactInfo } from '../services/settingsService'

export default function UserSupportController() {
  const { user } = useAuth()
  const [inquiries, setInquiries] = useState([])
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  // Load contact information
  useEffect(() => {
    const { email, phone } = getCompanyContactInfo()
    setContactEmail(email)
    setContactPhone(phone)
  }, [])

  // Fetch user inquiries on mount
  useEffect(() => {
    if (user?.id) {
      fetchInquiries()
    }
  }, [user])

  const fetchInquiries = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const result = await UserSupport.getUserInquiries(user.id)
      if (result.success) {
        setInquiries(result.data || [])
      } else {
        console.error('Failed to fetch inquiries:', result.error)
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectInquiry = async (inquiry) => {
    setSelectedInquiry(inquiry)
    setConversations([])

    // Fetch conversations for this inquiry
    const result = await UserSupport.getConversations(inquiry.id, inquiry.subject)
    if (result.success) {
      setConversations(result.data || [])
    }
  }

  // Subscribe to real-time conversation updates when an inquiry is selected
  useEffect(() => {
    if (!selectedInquiry?.id) return

    // Subscribe to real-time updates
    const subscription = UserSupport.subscribeToConversations(
      selectedInquiry.id,
      selectedInquiry.subject,
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

    // Cleanup subscription on unmount or when selectedInquiry changes
    return () => {
      if (subscription) {
        UserSupport.unsubscribeFromConversations(subscription)
      }
    }
  }, [selectedInquiry?.id, selectedInquiry?.subject])

  const handleCreateInquiry = async ({ subject, message }) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' }

    try {
      const result = await UserSupport.createInquiry({
        user_id: user.id,
        subject: subject,
        message: message
      })

      if (result.success) {
        // Refresh inquiries list
        await fetchInquiries()
        
        // Auto-select the new inquiry
        if (result.data) {
          setSelectedInquiry(result.data)
          setConversations([])
        }

        return { success: true }
      } else {
        console.error('Failed to create inquiry:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error creating inquiry:', error)
      return { success: false, error: error.message }
    }
  }

  const handleSendMessage = async (message, file = null) => {
    if (!user?.id || !selectedInquiry?.id) {
      return { success: false, error: 'Missing required data' }
    }

    if (!message.trim() && !file) {
      return { success: false, error: 'Message or file required' }
    }

    try {
      let fileUrl = null
      let fileName = null

      // Upload file if provided
      if (file) {
        const uploadResult = await UserSupport.uploadFile(file, user.id)
        if (!uploadResult.success) {
          console.error('File upload failed:', uploadResult.error)
          return { success: false, error: 'File upload failed' }
        }
        fileUrl = uploadResult.url
        fileName = file.name
      }

      // Send message with optional file attachment
      const result = await UserSupport.sendMessage({
        inquiry_id: selectedInquiry.id,
        sender_id: user.id,
        message: message.trim() || '(File attachment)',
        file_url: fileUrl,
        file_name: fileName,
        subject: selectedInquiry.subject
      })

      if (result.success) {
        // Refresh conversations
        const conversationsResult = await UserSupport.getConversations(selectedInquiry.id, selectedInquiry.subject)
        if (conversationsResult.success) {
          setConversations(conversationsResult.data || [])
        }

        // Update inquiry status in the list if it changed
        const updatedInquiry = await UserSupport.getInquiryById(selectedInquiry.id)
        if (updatedInquiry.success && updatedInquiry.data) {
          setSelectedInquiry(updatedInquiry.data)
          setInquiries(prev => prev.map(inq => 
            inq.id === updatedInquiry.data.id ? updatedInquiry.data : inq
          ))
        }

        return { success: true }
      } else {
        console.error('Failed to send message:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      return { success: false, error: error.message }
    }
  }

  return (
    <UserSupportView
      inquiries={inquiries}
      selectedInquiry={selectedInquiry}
      conversations={conversations}
      onSelectInquiry={handleSelectInquiry}
      onCreateInquiry={handleCreateInquiry}
      onSendMessage={handleSendMessage}
      loading={loading}
      contactEmail={contactEmail}
      contactPhone={contactPhone}
    />
  )
}
