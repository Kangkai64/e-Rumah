import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../components/context/AuthContext'
import { signOut } from '../services/authService'
import './Header.css'
import logo from '../assets/images/logo.png'

const Header = () => {
  const { user, userRole, applicationStatus } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
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
            <a href="#home" className="nav-link">Home</a>
            <a href="#eligibility" className="nav-link">Eligibility Criteria</a>
            <a href="#about" className="nav-link">About Us</a>
            <a href="#faqs" className="nav-link">FAQs</a>
            <a href="#news" className="nav-link">News & Media</a>
            <a href="#schedule" className="nav-link">Schedule My Property</a>
          </nav>

          <div className="header-actions">
            <a href="#contact" className="contact-link">Contact Us</a>
            <Link to="/login" className="login-btn">Login</Link>
            <button className="user-icon-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="#A8202D" strokeWidth="2"/>
                <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="#A8202D" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
    )
  }

  // User Header (Elder)
  if (userRole === 'user') {
    return (
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src={logo} alt="e-Rumah" className="logo-image" />
          </Link>

          <nav className="main-nav">
            {applicationStatus === 'complete' ? (
              <>
                <Link to="/user/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/user/application" className="nav-link">My Application</Link>
                <Link to="/user/documents" className="nav-link">Documents</Link>
                <Link to="/user/support" className="nav-link">Support</Link>
              </>
            ) : (
              <Link to="/application" className="nav-link">Complete Application</Link>
            )}
          </nav>

          <div className="header-actions">
            <span className="user-email">{user.email}</span>
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
            <Link to="/admin/users" className="nav-link">Users</Link>
            <Link to="/admin/reports" className="nav-link">Reports</Link>
            <Link to="/admin/settings" className="nav-link">Settings</Link>
          </nav>

          <div className="header-actions">
            <span className="user-email">{user.email} (Admin)</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
    )
  }

  // Customer Support Header
  if (userRole === 'support') {
    return (
      <header className="site-header">
        <div className="header-container">
          <Link to="/" className="logo">
            <img src={logo} alt="e-Rumah" className="logo-image" />
          </Link>

          <nav className="main-nav">
            <Link to="/support/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/support/inquiries" className="nav-link">Inquiries</Link>
            <Link to="/support/applications" className="nav-link">Applications</Link>
            <Link to="/support/knowledge-base" className="nav-link">Knowledge Base</Link>
          </nav>

          <div className="header-actions">
            <span className="user-email">{user.email} (Support)</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
    )
  }

  // Fallback (shouldn't happen)
  return null
}

export default Header
