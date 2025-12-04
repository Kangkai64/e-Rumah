import { Link } from 'react-router-dom'
import './Header.css'
import logo from '../assets/images/logo.png'

const Header = () => {
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
          <a href="#login" className="login-btn">Login</a>
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

export default Header
