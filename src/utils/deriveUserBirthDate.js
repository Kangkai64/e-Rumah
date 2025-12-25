import { parseICNumber } from './icParser'

// Derive user's birth date (YYYY-MM-DD) from IC with a conservative fallback
export const deriveUserBirthDate = (user) => {
  try {
    const icNumber = user?.ic_number || user?.icNumber || ''
    const parsed = parseICNumber(icNumber)

    if (parsed?.isValid && parsed?.birthDate?.year && parsed?.birthDate?.month && parsed?.birthDate?.day) {
      const { year, month, day } = parsed.birthDate
      return `${year}-${month}-${day}`
    }
  } catch (e) {
    // fall through to fallback
  }

  const oldestAllowed = new Date()
  oldestAllowed.setFullYear(oldestAllowed.getFullYear() - 120)
  return oldestAllowed.toISOString().split('T')[0]
}
