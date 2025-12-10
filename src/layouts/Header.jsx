import { Link } from 'react-router-dom'
import { useState, useRef } from 'react'
import './Header.css'
import logo from '../assets/images/logo.png'
import profileIcon from '../assets/icons/icon_profile.svg'
import applyNowIcon from '../assets/icons/icon_applyNow.svg'

const Header = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const dropdownTimeoutRef = useRef(null)

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

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <img src={logo} alt="e-Rumah" className="logo-image" />
        </Link>

        <nav className="main-nav">
          <Link to="/" className="nav-link">Home</Link>
          <a href="#eligibility" className="nav-link">Eligibility Criteria</a>
          <Link to="/about" className="nav-link">About Us</Link>
          <a href="#faqs" className="nav-link">FAQs</a>
          <a href="#news" className="nav-link">How to Apply</a>
          <Link to="/property-calculator" className="nav-link">Estimate My Property</Link>
        </nav>

        <div className="header-actions">
          <a href="#contact" className="apply-now-btn">
            <span>Apply Now</span>
            <img src={applyNowIcon} alt="Apply Now" className="apply-now-icon" />
          </a>
          
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
                <a href="/login" className="dropdown-item">Login</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
