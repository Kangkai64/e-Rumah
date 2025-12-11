// User Login Page
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn } from '../../services/authService'
import { supabase } from '../../config/supabase'
import './authLayout.css'
import logo from '../../assets/images/logo.png'
import bgImage from '../../assets/images/loginPageBg.jpg'

export default function UserLoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { user, error: signInError } = await signIn(formData.email, formData.password)

      if (signInError) {
        if (signInError.message?.includes('Email not confirmed')) {
          setError('Please verify your email before logging in. Check your inbox for the confirmation link.')
        } else {
          setError(signInError.message || 'Login failed')
        }
        setLoading(false)
        return
      }

      if (user) {
        // Check user role
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (roleError || !userData) {
          setError('Unable to verify user account')
          setLoading(false)
          return
        }

        // Only allow 'user' role on this page
        if (userData.role !== 'user') {
          setError('Please use Staff Login for admin/support accounts')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        console.log('✅ User login successful')
        navigate('/application')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <Link to="/staff-login" className="switch-login-btn">
        Staff Login →
      </Link>

      <div className="auth-content">
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-logo">
              <img src={logo} alt="e-Rumah" />
              <span>e-Rumah</span>
            </div>

            <h2 className="auth-title">Login</h2>
            <p className="auth-description">Enter your email and password</p>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className="forgot-link">Forgot Password</Link>
              </div>

              <p className="eligibility-note">
                **Note: For first time user, kindly click "Home" to proceed with Eligibility Criteria Check
              </p>

              <div className="form-buttons">
                <button type="submit" className="auth-btn primary" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <Link to="/" className="auth-btn secondary">Home</Link>
              </div>
            </form>

            <div className="mydigital-section">
              <button className="mydigital-btn">
                <span className="mydigital-icon">🔐</span>
                Sign in with MyDigital ID
              </button>
              <p className="mydigital-text">No MyDigital ID?</p>
              <a href="#" className="mydigital-link">Download and register now to get started.</a>
            </div>
          </div>
        </div>

        <div className="auth-image-side">
          <img src={bgImage} alt="Background" className="auth-bg-image" />
          <div className="auth-overlay">
            <h1>Welcome to e-Rumah</h1>
            <p>Enabling retired home owners to gain access to a lifetime of supplemental income stream for daily subsistence to cater to potential increases in the cost of living.</p>
          </div>
          <div className="auth-copyright">© Copyright 2025 e-Rumah</div>
        </div>
      </div>
    </div>
  )
}
