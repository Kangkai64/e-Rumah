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
        const { user, error } = await getCurrentUser()
        if (error) {
          throw error
        }
        if (user) {
          setCurrentUser(user)
        } else {
          setError('No user logged in')
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setError('Failed to load user information')
      }
    }
    
    fetchUser()
  }, [])
  
  // Fetch application details
  useEffect(() => {
    if (!applicationId || !currentUser) return
    
    const fetchApplicationData = async () => {
      setIsLoading(true)
      try {
        // Use Application model to get complete application details
        // This handles: fetching, ownership verification, data transformation, and timeline building
        const result = await Application.getMaintainApplicationDetails(applicationId, currentUser.id)

        if (!result.success) {
          setError(result.error || 'Failed to load application')
          setIsLoading(false)
          return
        }

        // Set application state from model result
        setApplication(result.data.application)
        setApplicationStatus(result.data.status)
        setApprovedAmount(result.data.approvedAmount)
        setTimeline(result.data.timeline)
        setError(null)
      } catch (err) {
        console.error('Error fetching application:', err)
        setError(err.message || 'Failed to load application')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchApplicationData()
  }, [applicationId, currentUser])
  
  // Handle edit application
  const handleEditApplication = () => {
    navigate(`/application/edit/${applicationId}`)
  }
  
  // Handle terminate application
  const handleTerminateApplication = async () => {
    if (window.confirm('Are you sure you want to terminate this application?')) {
      try {
        // Use Application model to update status
        const result = await Application.updateStatus(applicationId, 'terminated')
        
        if (result.success) {
          setApplicationStatus('terminated')
          setError(null)
        } else {
          setError(result.error || 'Failed to terminate application')
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
