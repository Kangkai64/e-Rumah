import './Button.css'
import { Link } from 'react-router-dom'

const Button = ({ children, variant = 'primary', onClick, className = '', to }) => {
  if (to) {
    return (
      <Link to={to} className={`btn btn-${variant} ${className}`}>
        {children}
      </Link>
    )
  }
  
  return (
    <button 
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export default Button
