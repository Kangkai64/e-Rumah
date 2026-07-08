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
  const emptyReturn = { 
    birthDate: { day: null, month: null, year: null }, 
    sex: null, 
    placeOfBirth: { code: null, isMalaysiaBorn: null }, 
    isValid: false 
  }

  if (!icNumber || typeof icNumber !== 'string') {
    return emptyReturn
  }

  // Remove dashes and spaces
  const cleanIC = icNumber.replace(/[-\s]/g, '')

  // Malaysian IC should be 12 digits
  if (cleanIC.length !== 12 || !/^\d{12}$/.test(cleanIC)) {
    return emptyReturn
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
    return emptyReturn
  }

  const isMalaysiaBorn = pbCodeInt >= 1 && pbCodeInt <= 59

  // Extract gender digit (last digit)
  const genderDigit = parseInt(cleanIC.substring(11, 12))

  // Determine century based on current year and age constraints
  const currentYear = new Date().getFullYear()
  const currentCentury = Math.floor(currentYear / 100) * 100
  const previousCentury = currentCentury - 100
  
  // Try current century first
  let fullYear = parseInt(currentCentury) + parseInt(year)
  
  // If this would make them born in the future or too young (< 55), use previous century
  if (fullYear > currentYear || (currentYear - fullYear) < 55) {
    fullYear = parseInt(previousCentury) + parseInt(year)
  }
  
  // If they'd be over 120 years old, use current century instead
  if ((currentYear - fullYear) > 120) {
    fullYear = parseInt(currentCentury) + parseInt(year)
  }

  // Validate month and day
  const monthInt = parseInt(month)
  const dayInt = parseInt(day)

  if (monthInt < 1 || monthInt > 12) {
    return emptyReturn
  }

  if (dayInt < 1 || dayInt > 31) {
    return emptyReturn
  }

  // Validate day based on month (check for valid day in that specific month)
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (dayInt > daysInMonth[monthInt - 1]) {
    return emptyReturn
  }

  // Additional validation: Check if the date is actually valid
  const testDate = new Date(fullYear, monthInt - 1, dayInt)
  if (testDate.getMonth() !== monthInt - 1 || testDate.getDate() !== dayInt) {
    return emptyReturn
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
 * Salutations that are specific to one gender, keyed by the salutation value.
 * Gender-neutral salutations (Dr, Other) are intentionally absent.
 */
export const SALUTATION_GENDER = {
  Mr: 'Male',
  'Tan Sri': 'Male',
  "Dato'": 'Male',
  Mdm: 'Female',
  Ms: 'Female',
  Mrs: 'Female',
}

/**
 * Whether a salutation is still valid for a given (IC-confirmed) sex.
 * Gender-neutral salutations, custom "Other:" entries, and an unconfirmed
 * sex are always considered compatible.
 * @param {string} salutation
 * @param {string} sex - 'Male' | 'Female' | ''
 * @returns {boolean}
 */
export function isSalutationCompatibleWithSex(salutation, sex) {
  if (!salutation || salutation.startsWith('Other:')) return true
  const gender = SALUTATION_GENDER[salutation]
  if (!gender) return true
  if (sex !== 'Male' && sex !== 'Female') return true
  return gender === sex
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
 * Calculate age in whole years from a birthdate
 * @param {Object} birthDate - {day, month, year}
 * @returns {number|null} age, or null if birthDate is incomplete
 */
export function calculateAge(birthDate) {
  if (!birthDate?.day || !birthDate?.month || !birthDate?.year) {
    return null
  }

  const dob = new Date(
    parseInt(birthDate.year, 10),
    parseInt(birthDate.month, 10) - 1,
    parseInt(birthDate.day, 10)
  )
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }

  return age
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

/**
 * Format raw digits into the YYMMDD-PB-###G IC layout as the user types
 * @param {string} value - raw input value (digits, possibly with dashes already)
 * @returns {string} dash-formatted IC string
 */
export function formatICInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 12)
  const parts = [digits.slice(0, 6), digits.slice(6, 8), digits.slice(8, 12)]
  return parts.filter(Boolean).join('-')
}

/**
 * Map a digit count (cursor position measured in raw digits typed) back to
 * a caret index within the dash-formatted string, so the cursor doesn't
 * jump to the end when editing in the middle of the IC number
 * @param {string} formatted - dash-formatted IC string
 * @param {number} digitCount - number of digits before the original cursor position
 * @returns {number} caret index within the formatted string
 */
export function getICCursorPosition(formatted, digitCount) {
  let seen = 0
  for (let i = 0; i < formatted.length; i++) {
    if (seen === digitCount) return i
    if (/\d/.test(formatted[i])) seen++
  }
  return formatted.length
}
