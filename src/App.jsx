import './App.css'
import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './components/context/AuthContext'
import Header from './layouts/Header'
import Footer from './layouts/Footer'
import HomePage from './components/landing/HomePage'
import AboutUs from './components/landing/AboutUs'
import StepByStep from './components/landing/StepByStep'
import FAQs from './components/landing/FAQs'
import ApplicationController from './controllers/ApplicationController.jsx'
import PropertyCalculatorController from './controllers/PropertyCalculatorController.jsx'
import MaintainApplicationController from './controllers/MaintainApplicationController.jsx'
import UserLoginPage from './components/auth/UserLoginPage'
import StaffLoginPage from './components/auth/StaffLoginPage'
import RegistrationPage from './components/auth/RegistrationPage'
import EligibilityCheck from './components/eligibility/EligibilityCheck'
import HealthReportController from './controllers/HealthReportController.jsx'
import ProtectedRoute from './components/ProtectedRoute'

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

          {/* User Dashboard Routes */}
          <Route path="/user/dashboard" element={
            <ProtectedRoute requireRole="user">
              <>
                <Header />
                <div style={{ minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
                  <h1>User Dashboard</h1>
                  <p>Welcome to your dashboard!</p>
                </div>
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
            <>
              <Header />
              <HealthReportController />
              <Footer />
            </>
          } />

          {/* Admin Routes */}
          <Route path="/admin/health-reports" element={
            <ProtectedRoute requireRole="admin">
              <>
                <Header />
                <HealthReportController />
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
