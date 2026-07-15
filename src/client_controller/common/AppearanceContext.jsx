import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  getAppearanceSettings,
  setTheme as persistTheme,
  setFontSize as persistFontSize,
} from '../../services/appearanceService'

const FONT_SCALES = {
  small: 0.9,
  medium: 1,
  large: 1.15,
  xlarge: 1.3,
}

const AppearanceContext = createContext(null)

export function AppearanceProvider({ children }) {
  const [{ theme, fontSize }, setSettings] = useState(getAppearanceSettings)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font-scale', FONT_SCALES[fontSize])
  }, [fontSize])

  // Keep in sync if appearance is changed in another tab
  useEffect(() => {
    const handleStorage = () => setSettings(getAppearanceSettings())
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const updateTheme = useCallback((newTheme) => {
    persistTheme(newTheme)
    setSettings((prev) => ({ ...prev, theme: newTheme }))
  }, [])

  const updateFontSize = useCallback((newFontSize) => {
    persistFontSize(newFontSize)
    setSettings((prev) => ({ ...prev, fontSize: newFontSize }))
  }, [])

  return (
    <AppearanceContext.Provider value={{ theme, fontSize, setTheme: updateTheme, setFontSize: updateFontSize }}>
      {children}
    </AppearanceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppearance() {
  const ctx = useContext(AppearanceContext)
  if (!ctx) {
    throw new Error('useAppearance must be used within an AppearanceProvider')
  }
  return ctx
}
