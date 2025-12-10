import './App.css'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './components/context/AuthContext'
import Header from './layouts/Header'
import Footer from './layouts/Footer'
import HomePage from './components/landing/HomePage'
import AboutUs from './components/landing/AboutUs'
import ApplicationController from './controllers/ApplicationController.jsx'
import MaintainApplicationController from './controllers/MaintainApplicationController.jsx'
import UserLoginPage from './components/auth/UserLoginPage'
import StaffLoginPage from './components/auth/StaffLoginPage'
import RegistrationPage from './components/auth/RegistrationPage'
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

          <Route path="/maintainApplication/:applicationId" element={
            <ProtectedRoute>
              <>
                <Header />
                <MaintainApplicationController />
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
