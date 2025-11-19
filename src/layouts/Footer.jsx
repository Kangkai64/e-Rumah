import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>e-Rumah</h4>
            <p>Reverse Annuity Scheme Management System</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="#about">About Us</a>
            <a href="#faq">FAQ</a>
            <a href="#support">Support</a>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>Email: support@rasms.gov.my</p>
            <p>Phone: 1-800-88-RASMS</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 e-Rumah. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
