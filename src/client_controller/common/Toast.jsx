import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleExclamation,
  faTriangleExclamation,
  faCircleInfo,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'

const ICONS = {
  success: faCircleCheck,
  error: faCircleExclamation,
  warning: faTriangleExclamation,
  info: faCircleInfo,
}

export default function Toast({ message, type = 'error', onClose }) {
  return (
    <div className={`toast toast-${type}`} role="alert">
      <FontAwesomeIcon icon={ICONS[type] || ICONS.error} className="toast-icon" />
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Dismiss notification">
        <FontAwesomeIcon icon={faXmark} />
      </button>
    </div>
  )
}
