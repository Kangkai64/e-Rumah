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
  const { applicationId } = useParams()
  const navigate = useNavigate()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [application, setApplication] = useState(null)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [approvedAmount, setApprovedAmount] = useState(null)
  const [timeline, setTimeline] = useState([])
  
  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser()
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
    if (!applicationId) return
    
    const fetchApplicationData = async () => {
      setIsLoading(true)
      try {
        // DUMMY DATA - Remove this when real data is ready
        const dummyData = {
          id: applicationId,
          user_id: 'user-123',
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
        setError(null)
        
        // Uncomment below when ready to use real data from database
        /*
        const result = await Application.getById(applicationId)
        
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
  }, [applicationId])
  
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
    
    if (appData.updated_at && appData.status === 'approved') {
      events.push({
        date: appData.updated_at,
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
    
    setTimeline(events)
  }
  
  // Handle edit application
  const handleEditApplication = () => {
    navigate(`/application/edit/${applicationId}`)
  }
  
  // Handle terminate application
  const handleTerminateApplication = async () => {
    if (window.confirm('Are you sure you want to terminate this application?')) {
      try {
        const result = await Application.updateStatus(applicationId, 'terminated')
        
        if (result.success) {
          setApplicationStatus('terminated')
          setError(null)
        } else {
          setError('Failed to terminate application')
        }
      } catch (err) {
        console.error('Error terminating application:', err)
        setError('Failed to terminate application')
      }
    }
  }
  
  return (
    <MaintainApplicationView
      isLoading={isLoading}
      error={error}
      application={application}
      applicationStatus={applicationStatus}
      approvedAmount={approvedAmount}
      timeline={timeline}
      onEditApplication={handleEditApplication}
      onTerminateApplication={handleTerminateApplication}
    />
  )
}

export default MaintainApplicationController
