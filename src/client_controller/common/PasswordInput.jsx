import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import './PasswordInput.css'

const PasswordInput = ({ inputRef, className = '', ...inputProps }) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input-wrapper">
      <input
        ref={inputRef}
        type={visible ? 'text' : 'password'}
        className={`password-input-field ${className}`}
        {...inputProps}
      />
      <button
        type="button"
        className="password-toggle-btn"
        onClick={() => setVisible((prev) => !prev)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        disabled={inputProps.disabled}
      >
        <FontAwesomeIcon icon={visible ? faEyeSlash : faEye} />
      </button>
    </div>
  )
}

export default PasswordInput
