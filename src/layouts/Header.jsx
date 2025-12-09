import { Link } from 'react-router-dom'
import { useState } from 'react'
import './Header.css'
import logo from '../assets/images/logo.png'
import profileIcon from '../assets/icons/icon_profile.svg'
import applyNowIcon from '../assets/icons/icon_apply_now.svg'

const Header = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <img src={logo} alt="e-Rumah" className="logo-image" />
        </Link>

        <nav className="main-nav">
          <a href="#home" className="nav-link">Home</a>
          <a href="#eligibility" className="nav-link">Eligibility Criteria</a>
          <a href="#about" className="nav-link">About Us</a>
          <a href="#faqs" className="nav-link">FAQs</a>
          <a href="#news" className="nav-link">How to Apply</a>
          <a href="#schedule" className="nav-link">Estimate My Property</a>
        </nav>

        <div className="header-actions">
          <a href="#contact" className="apply-now-btn">
            <span>Apply Now</span>
            <img src={applyNowIcon} alt="Apply Now" className="apply-now-icon" />
          </a>
          
          <div 
            className="user-icon-container"
            onMouseEnter={() => setShowProfileDropdown(true)}
            onMouseLeave={() => setShowProfileDropdown(false)}
          >
            <button className="user-icon-btn">
              <img src={profileIcon} alt="Profile" className="profile-icon" />
            </button>
            
            {showProfileDropdown && (
              <div className="profile-dropdown" onMouseEnter={() => setShowProfileDropdown(true)} onMouseLeave={() => setShowProfileDropdown(false)}>
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
