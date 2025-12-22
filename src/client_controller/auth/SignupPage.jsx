// Customer Registration Page
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../../services/authService'
import './auth.css'
import logo from '../../assets/images/logo.png'
import bgImage from '../../assets/images/loginPageBg.jpg'

export default function SignupPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.email !== formData.confirmEmail) {
      setError('Emails do not match')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const { user, error } = await signUp(
        formData.email,
        formData.password,
        {
          full_name: formData.fullName
        }
      )

      if (error) {
        setError(error.message || 'Signup failed')
        setLoading(false)
        return
      }

      if (user) {
        console.log('✅ Signup successful')
        alert('Account created successfully!')
        navigate('/login')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-content">
        <div className="auth-form-side">
          <div className="auth-form-container">
            <div className="auth-logo">
              <img src={logo} alt="e-Rumah" />
              <span>e-Rumah</span>
            </div>

            <h2 className="auth-title">Customer Registration</h2>
            <p className="auth-description">Enter your details to create your account</p>

            {error && <div className="error-box">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>IC Number *</label>
              <input
                type="text"
                name="icNumber"
                value={formData.icNumber}
                onChange={handleChange}
                placeholder="YYMMDD-PB-###G"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01X-XXXXXXX"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                required
                disabled={loading}
              />
            </div>

            <button 
              type="submit" 
              className="auth-btn"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
