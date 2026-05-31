import './Button.css'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight } from '@fortawesome/free-solid-svg-icons'

const Button = ({ children, variant = 'primary', onClick, className = '', to, showArrow = false }) => {
  if (to) {
    return (
      <Link to={to} className={`btn btn-${variant} ${className}`}>
        {children}
        {showArrow && <FontAwesomeIcon icon={faArrowRight} className="icon-arrow-right" />}
      </Link>
    )
  }
  
  return (
    <button 
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
    >
      {children}
      {showArrow && <FontAwesomeIcon icon={faArrowRight} className="icon-arrow-right" />}
    </button>
  )
}

export default Button
