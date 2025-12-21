import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/context/AuthContext'
import { signOut } from '../services/authService'
import { useState, useRef } from 'react'
import './Header.css'
import logo from '../assets/images/logo.png'
import profileIcon from '../assets/icons/icon_profile.svg'
import applyNowIcon from '../assets/icons/icon_applyNow.svg'

const Header = () => {
  const { user, userRole, applicationStatus } = useAuth()
  const navigate = useNavigate()
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const dropdownTimeoutRef = useRef(null)

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const handleMouseEnter = () => {
    // Clear any pending timeout
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
    }
    setShowProfileDropdown(true)
  }

  const handleMouseLeave = () => {
    // Add a small delay before closing to allow moving to the dropdown
    dropdownTimeoutRef.current = setTimeout(() => {
      setShowProfileDropdown(false)
    }, 200)
  }

  // Guest Header (not logged in)
  if (!user) {

    return (
        <header className="site-header">
          <div className="header-container">
            <Link to="/" className="logo">
              <img src={logo} alt="e-Rumah" className="logo-image" />
            </Link>

          <nav className="main-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/#eligibility" className="nav-link">Eligibility Criteria</Link>
            <Link to="/about" className="nav-link">About Us</Link>
            <Link to="/faqs" className="nav-link">FAQs</Link>
            <Link to="/step-by-step" className="nav-link">How to Apply</Link>
            <Link to="/property-calculator" className="nav-link">Estimate My Property</Link>
          </nav>

          <div className="header-actions">
            <Link to="/eligibility-check" className="apply-now-btn">
              <span>Apply Now</span>
              <img src={applyNowIcon} alt="Apply Now" className="apply-now-icon" />
            </Link>
            
            <div 
              className="user-icon-container"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button className="user-icon-btn">
                <img src={profileIcon} alt="Profile" className="profile-icon" />
              </button>
              
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <Link to="/login" className="dropdown-item">Login</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    )
  }

  // User Header (logged in with incomplete application)
  if (userRole === 'user' && applicationStatus === 'incomplete') {
    return (
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src={logo} alt="e-Rumah" className="logo-image" />
          </Link>

          <nav className="main-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/#eligibility" className="nav-link">Eligibility Criteria</Link>
            <Link to="/about" className="nav-link">About Us</Link>
            <Link to="/faqs" className="nav-link">FAQs</Link>
            <Link to="/step-by-step" className="nav-link">How to Apply</Link>
            <Link to="/property-calculator" className="nav-link">Estimate My Property</Link>
          </nav>

          <div className="header-actions">
            <Link to="/application" className="apply-now-btn">
              <span>Apply Now</span>
              <img src={applyNowIcon} alt="Apply Now" className="apply-now-icon" />
            </Link>
            
            <div 
              className="user-icon-container"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button className="user-icon-btn">
                <img src={profileIcon} alt="Profile" className="profile-icon" />
              </button>
              
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <button onClick={handleLogout} className="dropdown-item">Logout</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    )
  }

  // User Header (logged in with complete application)
  if (userRole === 'user' && applicationStatus === 'complete') {
    return (
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src={logo} alt="e-Rumah" className="logo-image" />
          </Link>

          <nav className="main-nav">
            <Link to="/user/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/user/health-reports" className="nav-link">Health Reports</Link>
            <Link to="/user/documents" className="nav-link">Documents</Link>
            <Link to="/user/support" className="nav-link">Support</Link>
          </nav>

          <div className="header-actions">
            <Link to="/user/application" className="apply-now-btn">
              <span>My Application</span>
              <img src={applyNowIcon} alt="My Application" className="apply-now-icon" />
            </Link>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
    )
  }

  // Admin Header
  if (userRole === 'admin') {
    return (
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src={logo} alt="e-Rumah" className="logo-image" />
          </Link>

          <nav className="main-nav">
            <Link to="/admin/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/admin/applications" className="nav-link">Applications</Link>
            <Link to="/admin/health-reports" className="nav-link">Health Reports</Link>
            <Link to="/admin/users" className="nav-link">Users</Link>
            <Link to="/admin/reports" className="nav-link">Reports</Link>
            <Link to="/admin/settings" className="nav-link">Settings</Link>
          </nav>

          <div className="header-actions">
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
    )
  }

  // Support Header
  if (userRole === 'support') {
    return (
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src={logo} alt="e-Rumah" className="logo-image" />
          </Link>

          <nav className="main-nav">
          </nav>

          <div className="header-actions">
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
    )
  }

  // Fallback (shouldn't reach here)
  return null
}

export default Header
