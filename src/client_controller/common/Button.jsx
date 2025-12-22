import './Button.css'
import { Link } from 'react-router-dom'
import iconArrowRight from '../../assets/icons/icon_arrowRight.svg'

const Button = ({ children, variant = 'primary', onClick, className = '', to, showArrow = false }) => {
  if (to) {
    return (
      <Link to={to} className={`btn btn-${variant} ${className}`}>
        {children}
        {showArrow && <img src={iconArrowRight} alt="Arrow Right" className="icon-arrow-right" />}
      </Link>
    )
  }
  
  return (
    <button 
      className={`btn btn-${variant} ${className}`}
      onClick={onClick}
    >
      {children}
      {showArrow && <img src={iconArrowRight} alt="Arrow Right" className="icon-arrow-right" />}
    </button>
  )
}

export default Button
