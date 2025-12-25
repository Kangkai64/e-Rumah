// Maintain Application Controller - Smart React Component
// Manages state for viewing and maintaining application details
// Orchestrates data fetching and user interactions
// NO imports from other controllers allowed!

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Application from '../models/Application'
import { getCurrentUser } from '../services/authService'
import MaintainApplicationView from '../views/MaintainApplicationView'

function MaintainApplicationController() {
  const { applicationId: urlApplicationId } = useParams() // Optional from URL
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [application, setApplication] = useState(null)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [approvedAmount, setApprovedAmount] = useState(null)
  const [monthlyPayout, setMonthlyPayout] = useState(null)
  const [flaggedCode, setFlaggedCode] = useState(null)
  const [flaggedReason, setFlaggedReason] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [documentsError, setDocumentsError] = useState(null)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [pdfError, setPdfError] = useState(null)
  
  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { user } = await getCurrentUser()
        setCurrentUser(user)
      } catch (err) {
        console.error('Error fetching user:', err)
        setError('Failed to load user information')
      }
    }
    
    fetchUser()
  }, [])
  
  // Fetch application details
  useEffect(() => {
    if (!currentUser) return
    
    const fetchApplicationData = async () => {
      setIsLoading(true)
      try {
        // Fetch application for current user
        const { loadApplicationData } = await import('../services/applicationService')
        const { application: appData, applicationData, error: loadError } = await loadApplicationData(currentUser.id)
        
        if (loadError) {
          setError('No application found. Please submit an application first.')
          setIsLoading(false)
          return
        }
        
        if (!appData) {
          setError('Your application has not been submitted yet.')
          setIsLoading(false)
          return
        }
        
        // Attach the form_data from application_data to the application object
        // This allows the view to access it as application.submitted_form_data
        const enrichedApplication = {
          ...appData,
          submitted_form_data: applicationData?.form_data || {}
        }
        
        setApplication(enrichedApplication)
        setApplicationStatus(appData.status)
        setFlaggedCode(appData.flagged_code)
        setFlaggedReason(appData.flagged_reason)
        
        // Calculate approved amount from property value (60% of market value)
        // This follows the same logic as UserDashboard
        if (appData.properties) {
          const propertyValue = appData.properties.expected_market_value || appData.properties.indicative_market_value || 0
          const eligibleAmount = propertyValue * 0.60
          const monthlyPayout = eligibleAmount / 60 // 60 months (5 years)
          
          setApprovedAmount(eligibleAmount)
          setMonthlyPayout(monthlyPayout)
        }
        
        buildTimeline(appData)
        setError(null)
      } catch (err) {
        console.error('Error fetching application:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchApplicationData()
  }, [currentUser])

  // Refetch application data when navigating back to this page
  useEffect(() => {
    if (!currentUser) return
    
    // Refetch whenever we're on the maintain application page
    const refetchApplicationData = async () => {
      try {
        console.log('🔄 Refetching application data...')
        const { loadApplicationData } = await import('../services/applicationService')
        const { application: appData, applicationData, error: loadError } = await loadApplicationData(currentUser.id)
        
        if (!loadError && appData) {
          // Attach the form_data from application_data to the application object
          const enrichedApplication = {
            ...appData,
            submitted_form_data: applicationData?.form_data || {}
          }
          
          setApplication(enrichedApplication)
          setApplicationStatus(appData.status)
          setFlaggedCode(appData.flagged_code)
          setFlaggedReason(appData.flagged_reason)
          
          // Calculate approved amount from property value (60% of market value)
          if (appData.properties) {
            const propertyValue = appData.properties.expected_market_value || appData.properties.indicative_market_value || 0
            const eligibleAmount = propertyValue * 0.60
            const monthlyPayout = eligibleAmount / 60
            
            setApprovedAmount(eligibleAmount)
            setMonthlyPayout(monthlyPayout)
          }
          
          buildTimeline(appData)
          console.log('✅ Application data refreshed, nominee2Name:', applicationData?.form_data?.nominee2Name)
        }
      } catch (err) {
        console.error('Error refetching application:', err)
      }
    }
    
    refetchApplicationData()
  }, [location.pathname, currentUser])


  // Fetch documents for the application
  useEffect(() => {
    if (!currentUser || !application) return

    const fetchDocuments = async () => {
      setDocumentsLoading(true)
      setDocumentsError(null)
      try {
        // Use the required documents method to get all 17 documents
        // Pass form data to filter out documents based on user choices (e.g., fire insurance)
        const result = await Application.getRequiredDocuments(
          currentUser.id,
          application.submitted_form_data
        )

        if (result.success) {
          console.log('Required documents loaded:', result.data)
          setDocuments(result.data)
        } else {
          setDocumentsError('Failed to load documents')
        }
      } catch (err) {
        console.error('Error fetching documents:', err)
        setDocumentsError('Error loading documents')
      } finally {
        setDocumentsLoading(false)
      }
    }

    fetchDocuments()
  }, [currentUser, application])
  
  // Build timeline from application data
  const buildTimeline = (appData) => {
    const events = []
    
    if (appData.submitted_at) {
      events.push({
        date: appData.submitted_at,
        title: 'Application Submitted',
        status: 'completed'
      })
    }
    
    if (appData.reviewed_at) {
      events.push({
        date: appData.reviewed_at,
        title: 'Application Reviewed',
        status: 'completed'
      })
    }
    
    if (appData.approved_at) {
      events.push({
        date: appData.approved_at,
        title: 'Application Approved',
        status: 'completed'
      })
    }
    
    if (appData.status === 'approved') {
      events.push({
        date: new Date().toISOString(),
        title: 'Payment Started',
        status: 'completed'
      })
    }

    // Add termination request event if exists
    if (appData.termination_submitted_at) {
      events.push({
        date: appData.termination_submitted_at,
        title: 'Termination Requested',
        status: 'completed'
      })
    }

    // Add termination approved event if exists
    if (appData.termination_update_at && appData.status === 'terminated') {
      events.push({
        date: appData.termination_update_at,
        title: 'Termination Approved',
        status: 'completed'
      })
    }
    
    setTimeline(events)
  }
  
  // Handle terminate application
  const handleTerminateApplication = async (terminationReason) => {
    try {
      const result = await Application.terminate(application.id, terminationReason)
      
      if (result.success) {
        setApplicationStatus('underReviewed')
        setError(null)
        // Redirect and refresh page after successful termination submission
        alert('Termination request submitted successfully. Redirecting...')
        window.location.href = '/user/application'
      } else {
        setError('Failed to submit termination request')
      }
    } catch (err) {
      console.error('Error submitting termination request:', err)
      setError('Failed to submit termination request')
    }
  }

  // Handle download PDF
  const handleDownloadPDF = async () => {
    if (!application?.id) {
      setPdfError('Application ID not found')
      return
    }
    
    if (!currentUser?.id) {
      setPdfError('User ID not found')
      return
    }

    setDownloadingPDF(true)
    setPdfError(null)

    try {
      console.log('Starting PDF download for application:', application.id, 'user:', currentUser.id)
      const result = await Application.downloadApplicationPDFDirect(application.id, currentUser.id)
      
      if (!result.success) {
        setPdfError(result.error || 'Failed to download PDF')
      }
    } catch (err) {
      console.error('Error downloading PDF:', err)
      setPdfError(err.message || 'Failed to download PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }
  
  // Handle document upload success - refresh documents
  const handleDocumentUploaded = async () => {
    console.log('Document uploaded, refreshing...')
    if (!currentUser || !application) return
    
    try {
      // Refetch documents after upload, passing form data for filtering
      const result = await Application.getRequiredDocuments(
        currentUser.id,
        application.submitted_form_data
      )
      if (result.success) {
        setDocuments(result.data)
      }
    } catch (err) {
      console.error('Error refreshing documents:', err)
    }
  }
  
  return (
    <MaintainApplicationView
      isLoading={isLoading}
      error={error}
      application={application}
      applicationStatus={applicationStatus}
      approvedAmount={approvedAmount}
      monthlyPayout={monthlyPayout}
      flaggedCode={flaggedCode}
      flaggedReason={flaggedReason}
      timeline={timeline}
      documents={documents}
      documentsLoading={documentsLoading}
      documentsError={documentsError}
      userId={currentUser?.id}
      onDocumentUploaded={handleDocumentUploaded}
      downloadingPDF={downloadingPDF}
      pdfError={pdfError}
      onDownloadPDF={handleDownloadPDF}
      onTerminateApplication={handleTerminateApplication}
    />
  )
}

export default MaintainApplicationController
