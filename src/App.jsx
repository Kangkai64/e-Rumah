import './App.css'
import { Routes, Route } from 'react-router-dom'
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
import AdminController from './controllers/AdminController.jsx'
import UserDashboardController from './controllers/UserDashboardController.jsx'
import UserLoginPage from './components/auth/UserLoginPage'
import StaffLoginPage from './components/auth/StaffLoginPage'
import RegistrationPage from './components/auth/RegistrationPage'
import EligibilityCheck from './components/eligibility/EligibilityCheck'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
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

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute requireRole="admin">
              <AdminController />
            </ProtectedRoute>
          } />

          <Route path="/admin/review/:applicationId" element={
            <ProtectedRoute requireRole="admin">
              <>
                <Header />
                <div style={{ minHeight: '100vh', padding: '2rem', textAlign: 'center' }}>
                  <h1>Application Review</h1>
                  <p>Review application details here.</p>
                </div>
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
