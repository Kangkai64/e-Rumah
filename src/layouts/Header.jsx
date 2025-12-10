import { Link } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import './Header.css'
import logo from '../assets/images/logo.png'
import profileIcon from '../assets/icons/icon_profile.svg'
import applyNowIcon from '../assets/icons/icon_applyNow.svg'
import { useAuth } from '../components/context/AuthContext'
import Application from '../models/Application'

const Header = () => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const dropdownTimeoutRef = useRef(null)
  const { user, role } = useAuth()

  const [primaryAction, setPrimaryAction] = useState({ label: 'Apply Now', to: '/application' })

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

  // Determine primary action based on role and whether user has an application
  useEffect(() => {
    let mounted = true

    const decideAction = async () => {
      if (!user) {
        if (mounted) setPrimaryAction({ label: 'Apply Now', to: '/application' })
        return
      }

      // Admin and Support have their own dashboards
      if (role === 'admin') {
        if (mounted) setPrimaryAction({ label: 'Admin Dashboard', to: '/admin' })
        return
      }

      if (role === 'customerSupport') {
        if (mounted) setPrimaryAction({ label: 'Support Dashboard', to: '/support' })
        return
      }

      // Regular user: check if they have applications
      try {
        const result = await Application.getByUserId(user.id)
        if (result.success && result.data && result.data.length > 0) {
          const appId = result.data[0].id
          if (mounted) setPrimaryAction({ label: 'Maintain Application', to: `/maintainApplication/${appId}` })
        } else {
          if (mounted) setPrimaryAction({ label: 'Apply Now', to: '/application' })
        }
      } catch (err) {
        console.error('Error checking user applications:', err)
        if (mounted) setPrimaryAction({ label: 'Apply Now', to: '/application' })
      }
    }

    decideAction()

    return () => { mounted = false }
  }, [user, role])

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
          <a href="/FAQs" className="nav-link">FAQs</a>
          <a href="#news" className="nav-link">How to Apply</a>
          <a href="#schedule" className="nav-link">Estimate My Property</a>
        </nav>

        <div className="header-actions">
          <Link to={primaryAction.to} className="apply-now-btn">
            <span>{primaryAction.label}</span>
            <img src={applyNowIcon} alt={primaryAction.label} className="apply-now-icon" />
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
