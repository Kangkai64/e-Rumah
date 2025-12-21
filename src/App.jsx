import './App.css'
import { useEffect, useState } from 'react'
import { Routes, Route, useLocation, useParams } from 'react-router-dom'
import { AuthProvider } from './components/context/AuthContext'
import { supabase } from './config/supabase'
import Header from './layouts/Header'
import Footer from './layouts/Footer'
import HomePage from './components/landing/HomePage'
import AboutUs from './components/landing/AboutUs'
import StepByStep from './components/landing/StepByStep'
import FAQs from './components/landing/FAQs'
import ApplicationController from './controllers/ApplicationController.jsx'
import PropertyCalculatorController from './controllers/PropertyCalculatorController.jsx'
import MaintainApplicationController from './controllers/MaintainApplicationController.jsx'
import AdminController from './controllers/AdminController.jsx'
import AdminApplicationReviewController from './controllers/AdminApplicationReviewController.jsx'
import UserDashboardController from './controllers/UserDashboardController.jsx'
import CustomerSupportController from './controllers/CustomerSupportController.jsx'
import UserLoginPage from './components/auth/UserLoginPage'
import StaffLoginPage from './components/auth/StaffLoginPage'
import RegistrationPage from './components/auth/RegistrationPage'
import EligibilityCheck from './components/eligibility/EligibilityCheck'
import HealthReportController from './controllers/HealthReportController.jsx'
import ProtectedRoute from './components/ProtectedRoute'
import downloadIcon from './assets/icons/health_report_page/icon_download.svg'
import infoIcon from './assets/icons/health_report_page/icon_info.svg'

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '')

      // Wait for the next paint to ensure the target is in the DOM
      requestAnimationFrame(() => {
        const target = document.getElementById(targetId)

        if (target) {
          const headerOffset = 96
          const targetTop = target.getBoundingClientRect().top + window.scrollY
          const scrollTop = Math.max(targetTop - headerOffset, 0)

          window.scrollTo({ top: scrollTop, left: 0, behavior: 'smooth' })
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        }
      })
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }
  }, [pathname, search, hash])

  return null
}

// Inline SharedReportPage component
const SharedReportPage = () => {
  const { token } = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [report, setReport] = useState(null)
  const [shareData, setShareData] = useState(null)

  useEffect(() => {
    const loadSharedReport = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch shared report data
        const { data, error } = await supabase
          .from('health_report_shares')
          .select(`
            *,
            health_reports(*)
          `)
          .eq('share_token', token)
          .eq('is_revoked', false)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            setError('This shared link has expired or does not exist.')
          } else {
            setError('Failed to load shared report. Please try again.')
          }
          return
        }

        if (!data || !data.health_reports) {
          setError('Report not found, expired, or access revoked.')
          return
        }

        setReport(data.health_reports)
        setShareData(data)

        // Optional: Update access tracking
        await supabase
          .from('health_report_shares')
          .update({
            access_count: (data.access_count || 0) + 1,
            last_accessed_at: new Date().toISOString()
          })
          .eq('id', data.id)
      } catch (err) {
        console.error('Error loading shared report:', err)
        setError('An unexpected error occurred. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      loadSharedReport()
    } else {
      setError('Invalid share link.')
      setIsLoading(false)
    }
  }, [token])

  const handleDownload = async () => {
    if (report?.report_file_url) {
      try {
        // Extract file extension from URL
        const url = report.report_file_url
        const urlParts = url.split('.')
        const extension = urlParts.length > 1 ? `.${urlParts.pop()}` : ''
        
        // Create filename with proper extension
        const filename = `${report.report_title || 'health-report'}${extension}`
        
        // Try to fetch and download the file
        const response = await fetch(url)
        if (!response.ok) throw new Error('Failed to fetch file')
        
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename
        link.style.display = 'none'
        
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up the blob URL
        setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 100)
      } catch (error) {
        console.error('Download failed:', error)
        // Fallback to direct link method
        const link = document.createElement('a')
        link.href = report.report_file_url
        link.download = report.report_title || 'health-report'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isImage = (url) => {
    if (!url) return false
    const extension = url.split('.').pop()?.toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)
  }

  const isPDF = (url) => {
    if (!url) return false
    const extension = url.split('.').pop()?.toLowerCase()
    return extension === 'pdf'
  }

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Loading shared report...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>Unable to Load Report</h2>
        <p style={{ color: '#666', maxWidth: '500px' }}>{error}</p>
        <button 
          onClick={() => window.close()} 
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close Window
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      padding: '2rem'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Shared Health Report</h1>
          <p style={{ margin: 0, color: '#666' }}>Securely shared medical document</p>
        </div>
        <button 
          onClick={handleDownload}
          style={{
            backgroundColor: '#B91C1C',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            lineHeight: '20px',
            cursor: 'pointer',
            fontFamily: 'Poppins, sans-serif',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(185, 28, 28, 0.2)'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#991B1B'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#B91C1C'}
        >
          <img src={downloadIcon} alt="Download Icon" style={{ width: '20px', height: '20px' }} /> Download Report
        </button>
      </header>

      {/* Report Details */}
      <section style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        marginBottom: '2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem'
        }}>
          <div>
            <strong>Report Title:</strong>
            <p>{report.report_title || 'Untitled Report'}</p>
          </div>
          <div>
            <strong>Report Type:</strong>
            <p>{report.report_type}</p>
          </div>
          <div>
            <strong>Provider:</strong>
            <p>{report.provider_name || 'Not specified'}</p>
          </div>
          <div>
            <strong>Report Date:</strong>
            <p>{formatDate(report.report_date)}</p>
          </div>
          {report.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <strong>Notes:</strong>
              <p>{report.notes}</p>
            </div>
          )}
        </div>
      </section>

      {/* Share Info */}
      {shareData && (
        <section style={{
          backgroundColor: '#e3f2fd',
          padding: '1rem',
          borderRadius: '6px',
          marginBottom: '2rem',
          border: '1px solid #bbdefb'
        }}>
          <strong><img src={infoIcon} alt="Info Icon" style={{ width: '24px', height: '24px', marginRight: '6px', verticalAlign: 'middle' }} /> Shared Report:</strong> This link expires on{' '}
          {formatDate(shareData.expires_at)}
          {shareData.shared_with_email && (
            <span> • Shared with: {shareData.shared_with_email}</span>
          )}
        </section>
      )}

      {/* Document Viewer */}
      <section style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {isPDF(report.report_file_url) ? (
          <div style={{ minHeight: '70vh' }}>
            <iframe
              src={report.report_file_url}
              title={`Health Report: ${report.report_title}`}
              style={{
                width: '100%',
                height: '70vh',
                border: 'none'
              }}
            />
          </div>
        ) : isImage(report.report_file_url) ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <img
              src={report.report_file_url}
              alt={`Health Report: ${report.report_title}`}
              style={{
                maxWidth: '100%',
                height: 'auto',
                borderRadius: '4px'
              }}
            />
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ fontSize: '3rem' }}>📄</div>
            <h3>Medical Document</h3>
            <p>{report.report_title}</p>
            <button 
              onClick={handleDownload} 
              style={{
                backgroundColor: '#B91C1C',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                lineHeight: '20px',
                cursor: 'pointer',
                fontFamily: 'Poppins, sans-serif',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(185, 28, 28, 0.2)'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#991B1B'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#B91C1B'}
            >
              <img src={downloadIcon} alt="Download Icon" style={{ width: '20px', height: '20px' }} /> Download File
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        textAlign: 'center',
        fontSize: '0.875rem',
        color: '#666'
      }}>
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>Privacy Notice:</strong> This document contains confidential medical information. 
          Please handle with care and do not share further without authorization.
        </p>
        <p style={{ margin: 0 }}>
          Shared securely via e-Rumah Health Management System
        </p>
      </footer>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <div className="app">
        <Routes>
          <Route path="/" element={
            <>
              <Header />
              <HomePage />
              <Footer />
            </>
          } />

          <Route path="/about" element={
            <>
              <Header />
              <AboutUs />
              <Footer />
            </>
          } />

          <Route path="/eligibility-check" element={<EligibilityCheck />} />
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/staff-login" element={<StaffLoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />

          <Route path="/application" element={
            <ProtectedRoute>
              <>
                <Header />
                <ApplicationController />
                <Footer />
              </>
            </ProtectedRoute>
          } />

          <Route path="/application/edit-nominees/:applicationId" element={
            <ProtectedRoute requireRole="user">
              <>
                <Header />
                <ApplicationController editNomineeOnly={true} />
                <Footer />
              </>
            </ProtectedRoute>
          } />

          {/* User Dashboard Routes */}
          <Route path="/user/dashboard" element={
            <ProtectedRoute requireRole="user">
              <>
                <Header />
                <UserDashboardController />
                <Footer />
              </>
            </ProtectedRoute>
          } />

          <Route path="/user/application" element={
            <ProtectedRoute requireRole="user">
              <>
                <Header />
                <MaintainApplicationController />
                <Footer />
              </>
            </ProtectedRoute>
          } />

          <Route path="/user/documents" element={
            <ProtectedRoute requireRole="user">
              <>
                <Header />
                <div style={{ minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
                  <h1>Documents</h1>
                  <p>Your documents will appear here.</p>
                </div>
                <Footer />
              </>
            </ProtectedRoute>
          } />

          <Route path="/user/support" element={
            <ProtectedRoute requireRole="user">
              <>
                <Header />
                <div style={{ minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
                  <h1>Support</h1>
                  <p>Contact support or view FAQs here.</p>
                </div>
                <Footer />
              </>
            </ProtectedRoute>
          } />

          <Route path="/step-by-step" element={
            <>
              <Header />
              <StepByStep />
              <Footer />
            </>
          } />

          <Route path="/faqs" element={
            <>
              <Header />
              <FAQs />
              <Footer />
            </>
          } />

          <Route path="/maintainApplication/:applicationId" element={
            <ProtectedRoute>
              <>
                <Header />
                <MaintainApplicationController />
                <Footer />
              </>
            </ProtectedRoute>
          } />

          <Route path="/property-calculator" element={
            <>
              <Header />
              <PropertyCalculatorController />
              <Footer />
            </>
          } />

          <Route path="/user/health-reports" element={
            <ProtectedRoute requireRole="user">
              <>
                <Header />
                <HealthReportController />
                <Footer />
              </>
            </ProtectedRoute>
          } />

          <Route path="/application/:applicationId/health-reports" element={
            <ProtectedRoute>
              <>
                <Header />
                <HealthReportController />
                <Footer />
              </>
            </ProtectedRoute>
          } />

          <Route path="/maintainApplication/:applicationId/health-reports" element={
            <ProtectedRoute>
              <>
                <Header />
                <HealthReportController />
                <Footer />
              </>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireRole="admin">
                <Header />
                <AdminController />
                <Footer />
            </ProtectedRoute>
          } />

          <Route path="/admin/review/:applicationId" element={
            <ProtectedRoute requireRole="admin">
              <>
                <Header />
                <AdminApplicationReviewController />
                <Footer />
              </>
            </ProtectedRoute>
          } />

          <Route path="/admin/health-reports" element={
            <ProtectedRoute requireRole="admin">
              <>
                <Header />
                <HealthReportController />
                <Footer />
              </>
            </ProtectedRoute>
          } />

          {/* Public Shared Report Route - No authentication required */}
          <Route path="/shared-report/:token" element={<SharedReportPage />} />

          {/* Customer Support Routes */}
          <Route path="/support/dashboard" element={
            <ProtectedRoute requireRole="support">
              <>
                <Header />
                <CustomerSupportController />
                <Footer />
              </>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App
