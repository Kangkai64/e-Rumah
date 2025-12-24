/**
 * Malaysian IC Number Parser Utility
 * Extracts birthdate and sex from Malaysian IC/NRIC number
 * 
 * IC Format: YYMMDD-PB-###G
 * - YYMMDD: Date of birth
 * - PB: Place of birth (state code)
 *   - 01-59: Born in Malaysia
 *   - 60-99: Born outside Malaysia (Foreign/PR)
 * - ###: Running number
 * - G: Gender (odd = male, even = female)
 */

/**
 * Parse Malaysian IC number and extract birthdate, sex, and place of birth
 * @param {string} icNumber - Malaysian IC number (with or without dashes)
 * @returns {Object} { birthDate: {day, month, year}, sex: 'Male'|'Female'|null, placeOfBirth: {code: string, isMalaysiaBorn: boolean}, isValid: boolean }
 */
export function parseICNumber(icNumber) {
  if (!icNumber) {
    return { birthDate: null, sex: null, placeOfBirth: null, isValid: false }
  }

  // Remove dashes and spaces
  const cleanIC = icNumber.replace(/[-\s]/g, '')

  // Malaysian IC should be 12 digits
  if (cleanIC.length !== 12 || !/^\d{12}$/.test(cleanIC)) {
    return { birthDate: null, sex: null, placeOfBirth: null, isValid: false }
  }

  // Extract date components (YYMMDD)
  const year = cleanIC.substring(0, 2)
  const month = cleanIC.substring(2, 4)
  const day = cleanIC.substring(4, 6)

  // Extract Place of Birth (PB) - digits 7 & 8
  const pbCode = cleanIC.substring(6, 8)
  const pbCodeInt = parseInt(pbCode)
  
  // Validate Place of Birth code (00 is invalid)
  if (pbCodeInt < 1) {
    return { birthDate: null, sex: null, placeOfBirth: null, isValid: false }
  }

  const isMalaysiaBorn = pbCodeInt >= 1 && pbCodeInt <= 59

  // Extract gender digit (last digit)
  const genderDigit = parseInt(cleanIC.substring(11, 12))

  // Determine full year (assuming threshold: 00-25 = 2000s, 26-99 = 1900s)
  const currentYear = new Date().getFullYear()
  const currentCentury = Math.floor(currentYear / 100) * 100
  const yearInt = parseInt(year)
  let fullYear

  if (yearInt <= 25) {
    fullYear = currentCentury + yearInt // 2000-2025
  } else {
    fullYear = (currentCentury - 100) + yearInt // 1926-1999
  }

  // Validate month and day
  const monthInt = parseInt(month)
  const dayInt = parseInt(day)

  if (monthInt < 1 || monthInt > 12) {
    return { birthDate: null, sex: null, placeOfBirth: null, isValid: false }
  }

  if (dayInt < 1 || dayInt > 31) {
    return { birthDate: null, sex: null, placeOfBirth: null, isValid: false }
  }

  // Validate day based on month (check for valid day in that specific month)
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (dayInt > daysInMonth[monthInt - 1]) {
    return { birthDate: null, sex: null, placeOfBirth: null, isValid: false }
  }

  // Additional validation: Check if the date is actually valid
  const testDate = new Date(fullYear, monthInt - 1, dayInt)
  if (testDate.getMonth() !== monthInt - 1 || testDate.getDate() !== dayInt) {
    return { birthDate: null, sex: null, placeOfBirth: null, isValid: false }
  }

  // Determine sex (odd = male, even = female)
  const sex = genderDigit % 2 === 0 ? 'Female' : 'Male'

  return {
    birthDate: {
      day: day,
      month: month,
      year: fullYear.toString()
    },
    sex: sex,
    placeOfBirth: {
      code: pbCode,
      isMalaysiaBorn: isMalaysiaBorn
    },
    isValid: true
  }
}

/**
 * Format date for display
 * @param {Object} birthDate - {day, month, year}
 * @returns {string} Formatted date string
 */
export function formatBirthDate(birthDate) {
  if (!birthDate) return ''
  return `${birthDate.day}/${birthDate.month}/${birthDate.year}`
}

/**
 * Get current date in separate components
 * @returns {Object} {day, month, year}
 */
export function getCurrentDate() {
  const now = new Date()
  return {
    day: now.getDate().toString().padStart(2, '0'),
    month: (now.getMonth() + 1).toString().padStart(2, '0'),
    year: now.getFullYear().toString()
  }
}
