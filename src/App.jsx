import './App.css'

function App() {
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="logo">e-Rumah</div>
          <nav className="nav">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#eligibility">Eligibility</a>
            <a href="#contact">Contact</a>
            <button className="btn-login">Login</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">Reverse Annuity Scheme<br />Management System</h1>
          <p className="hero-subtitle">
            Convert your home equity into monthly income while continuing to live in your home.
            <br />For Malaysian seniors aged 60 and above.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary">Apply Now</button>
            <button className="btn-secondary">Learn More</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-number">01</div>
              <h3>Apply Online</h3>
              <p>Complete your application with guided assistance through our elderly-friendly interface.</p>
            </div>
            <div className="feature-card">
              <div className="feature-number">02</div>
              <h3>Get Approved</h3>
              <p>Our team reviews your eligibility and property valuation within 7-14 working days.</p>
            </div>
            <div className="feature-card">
              <div className="feature-number">03</div>
              <h3>Receive Payments</h3>
              <p>Choose monthly income, lump sum, or credit line while staying in your home.</p>
            </div>
            <div className="feature-card">
              <div className="feature-number">04</div>
              <h3>Stay Protected</h3>
              <p>Nominee monitoring and compliance reminders ensure your rights are protected.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Eligibility Section */}
      <section className="eligibility">
        <div className="container">
          <h2 className="section-title">Eligibility Requirements</h2>
          <div className="eligibility-grid">
            <div className="eligibility-box">
              <h3>For Applicants</h3>
              <ul>
                <li>Malaysian citizen / PR / MM2H</li>
                <li>Age 60 years or above</li>
                <li>Legally capable</li>
                <li>Must have at least one nominee</li>
              </ul>
            </div>
            <div className="eligibility-box">
              <h3>For Property</h3>
              <ul>
                <li>Freehold landed property</li>
                <li>Located in Setapak</li>
                <li>No existing loans or mortgages</li>
                <li>Owner-occupied</li>
                <li>Has CCC/CF certification</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Ready to Get Started?</h2>
          <p>Join hundreds of Malaysian seniors who have secured their financial future.</p>
          <button className="btn-primary">Start Your Application</button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>RASMS</h4>
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
            <p>© 2025 RASMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
