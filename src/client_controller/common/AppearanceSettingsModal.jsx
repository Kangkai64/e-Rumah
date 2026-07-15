import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSun, faMoon, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useAppearance } from './AppearanceContext'
import './AppearanceSettingsModal.css'

const FONT_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'X-Large' },
]

export default function AppearanceSettingsModal({ isOpen, onClose }) {
  const { theme, fontSize, setTheme, setFontSize } = useAppearance()

  if (!isOpen) return null

  return (
    <div className="appearance-modal-overlay" onClick={onClose}>
      <div
        className="appearance-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appearance-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="appearance-modal-header">
          <h2 id="appearance-modal-title">Display Settings</h2>
          <button className="appearance-modal-close" onClick={onClose} aria-label="Close">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="appearance-modal-section">
          <span className="appearance-modal-label">Theme</span>
          <div className="appearance-theme-options">
            <button
              type="button"
              className={`appearance-theme-btn${theme === 'light' ? ' active' : ''}`}
              onClick={() => setTheme('light')}
              aria-pressed={theme === 'light'}
            >
              <FontAwesomeIcon icon={faSun} />
              <span>Light</span>
            </button>
            <button
              type="button"
              className={`appearance-theme-btn${theme === 'dark' ? ' active' : ''}`}
              onClick={() => setTheme('dark')}
              aria-pressed={theme === 'dark'}
            >
              <FontAwesomeIcon icon={faMoon} />
              <span>Dark</span>
            </button>
          </div>
        </div>

        <div className="appearance-modal-section">
          <span className="appearance-modal-label">Font Size</span>
          <div className="appearance-fontsize-options">
            {FONT_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`appearance-fontsize-btn${fontSize === option.value ? ' active' : ''}`}
                onClick={() => setFontSize(option.value)}
                aria-pressed={fontSize === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
