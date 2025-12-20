// Maintain Application Controller - Smart React Component
// Manages state for viewing and maintaining application details
// Orchestrates data fetching and user interactions
// NO imports from other controllers allowed!

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Application from '../models/Application'
import { getCurrentUser } from '../services/authService'
import MaintainApplicationView from '../views/MaintainApplicationView'

function MaintainApplicationController() {
  const { applicationId: urlApplicationId } = useParams() // Optional from URL
  const navigate = useNavigate()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [application, setApplication] = useState(null)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [approvedAmount, setApprovedAmount] = useState(null)
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
        
        // Extract approved amount from form_data
        if (applicationData?.form_data?.approvedAmount) {
          setApprovedAmount(parseFloat(applicationData.form_data.approvedAmount))
        }
        
        buildTimeline(appData)
        setError(null)
        
        // DUMMY DATA FOR TESTING - Remove this block when real data structure is confirmed
        /* const dummyData = {
          id: appData.id,
          user_id: currentUser.id,
          status: 'approved',
          submitted_at: '2025-11-15T10:30:00Z',
          updated_at: '2025-12-01T14:20:00Z',
          submitted_form_data: {
            nameAsPerNRIC: 'Ahmad bin Hassan',
            age: '68 years',
            nricNo: '560813-10-1234',
            telephone: '012-3456789',
            email: 'ahmad.hassan@email.com',
            maritalStatus: '2 (Ages 25, 30)',
            isJointApplicant: true,
            jSalutation: 'Encik',
            jName: 'Siti Mariam Ahmad',
            jMalaysian: true,
            jAge: '65 years',
            jEmail: 'siti.mariam@email.com',
            jTelephone: '012-9876543',
            propertyAddress: 'No. 45, Jalan Merdeka 3/2, Taman Mutiara, 53100 Kuala Lumpur',
            propertyType: 'Terrace House',
            ownershipDuration: '15',
            propertyValue: '450000',
            approvedAmount: '1850.00',
            nominees: [
              {
                name: 'Siti Izzati Ahmad',
                nric: '560813-10-5678',
                relationship: 'Daughter'
              },
              {
                name: 'Hanisah bin Ahmad',
                nric: '560813-10-9012',
                relationship: 'Sister'
              }
            ]
          }
        }
        
        setApplication(dummyData)
        setApplicationStatus(dummyData.status)
        setApprovedAmount(parseFloat(dummyData.submitted_form_data.approvedAmount))
        buildTimeline(dummyData)
        setError(null) */
        
        // Old code kept for reference
        /*
        const result = await Application.getById(urlApplicationId || appData.id)
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch application')
        }
        
        const appData = result.data
        
        // Verify user owns this application
        if (appData.user_id !== currentUser.id) {
          setError('You do not have permission to view this application')
          setIsLoading(false)
          return
        }
        
        setApplication(appData)
        setApplicationStatus(appData.status)
        
        // Extract approved amount from application data
        if (appData.submitted_form_data) {
          setApprovedAmount(appData.submitted_form_data.approvedAmount || 0)
        }
        
        // Build timeline from application history
        buildTimeline(appData)
        
        setError(null)
        */
      } catch (err) {
        console.error('Error fetching application:', err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchApplicationData()
  }, [currentUser])

  // Fetch documents for the application
  useEffect(() => {
    if (!currentUser || !application) return

    const fetchDocuments = async () => {
      setDocumentsLoading(true)
      setDocumentsError(null)
      try {
        // Use the required documents method to get all 17 documents
        const result = await Application.getRequiredDocuments(currentUser.id)

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
  
  // Handle edit application
  const handleEditApplication = () => {
    navigate(`/application/edit/${applicationId}`)
  }
  
  // Handle terminate application
  const handleTerminateApplication = async (terminationReason) => {
    try {
      const result = await Application.terminate(application.id, terminationReason)
      
      if (result.success) {
        setApplicationStatus('underReviewed')
        setError(null)
        // Redirect to user applications page after successful submission
        navigate('/user/application')
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
    if (!currentUser) return
    
    try {
      // Refetch documents after upload
      const result = await Application.getRequiredDocuments(currentUser.id)
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
      onEditApplication={handleEditApplication}
      onTerminateApplication={handleTerminateApplication}
    />
  )
}

export default MaintainApplicationController
