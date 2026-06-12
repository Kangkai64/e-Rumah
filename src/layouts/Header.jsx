import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../client_controller/sessionController/AuthContext'
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
            <NavLink to="/" end className="nav-link">Home</NavLink>
            <Link to="/#eligibility" className="nav-link">Eligibility Criteria</Link>
            <NavLink to="/about" className="nav-link">About Us</NavLink>
            <NavLink to="/faqs" className="nav-link">FAQs</NavLink>
            <NavLink to="/step-by-step" className="nav-link">How to Apply</NavLink>
            <NavLink to="/property-calculator" className="nav-link">Estimate My Property</NavLink>
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
            <NavLink to="/" end className="nav-link">Home</NavLink>
            <Link to="/#eligibility" className="nav-link">Eligibility Criteria</Link>
            <NavLink to="/about" className="nav-link">About Us</NavLink>
            <NavLink to="/faqs" className="nav-link">FAQs</NavLink>
            <NavLink to="/step-by-step" className="nav-link">How to Apply</NavLink>
            <NavLink to="/property-calculator" className="nav-link">Estimate My Property</NavLink>
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

  // User Header (logged in with complete or terminated application)
  if (userRole === 'user' && (applicationStatus === 'complete' || applicationStatus === 'terminated')) {
    return (
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src={logo} alt="e-Rumah" className="logo-image" />
          </Link>

          <nav className="main-nav">
            <NavLink to="/user/dashboard" className="nav-link">Dashboard</NavLink>
            <NavLink to="/user/health-reports" className="nav-link">Health Reports</NavLink>
            <NavLink to="/user/support" className="nav-link">Support</NavLink>
          </nav>

          <div className="header-actions">
            <Link to="/user/application" className="apply-now-btn">
              <span>My Application</span>
              <img src={applyNowIcon} alt="My Application" className="apply-now-icon" />
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

  // Admin Header
  if (userRole === 'admin') {
    return (
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src={logo} alt="e-Rumah" className="logo-image" />
          </Link>

          <nav className="main-nav">
            <NavLink to="/admin/dashboard" className="nav-link">Application Review</NavLink>
            <NavLink to="/admin/health-reports" className="nav-link">Health Report Review</NavLink>
            <NavLink to="/admin/disbursements" className="nav-link">Disbursements</NavLink>
          </nav>

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
      </header>
    )
  }

  // Fallback (shouldn't reach here)
  return null
}

export default Header
