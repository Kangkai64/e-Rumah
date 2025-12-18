// List of common temporary email domains
const TEMP_EMAIL_DOMAINS = [
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'temp-mail.org',
  'throwaway.email',
  'sharklasers.com',
  'yopmail.com',
  'maildrop.cc',
  'mintemail.com',
  'trashmail.com',
  'temp-mail.io',
  'disposablemail.com',
  'spam4.me',
  'grr.la',
  'harakirimail.com',
  'moakt.com',
  'pokemail.net',
  'tempmail.email',
  'throwawaymail.com',
  'fakemail.net',
  'fakeinbox.com',
  'mailnesia.com',
  'temp-mail.net',
  'mytempemail.com',
  'tempemails.com',
  '10minutemail.de',
  'mailay.com',
  'mailbox.click',
  'maildme.com',
]

const MALAYSIAN_PHONE_REGEX = /^(\+?6?01)[0|1|2|3|4|6|7|8|9]\-*[0-9]{7,8}$/

export const validateEnquiryForm = (formData) => {
  const errors = {}

  // Validate name
  if (!formData.name || formData.name.trim() === '') {
    errors.name = 'Name is required'
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  } else if (formData.name.trim().length > 100) {
    errors.name = 'Name must not exceed 100 characters'
  }

  // Validate contact number
  if (!formData.contactNumber || formData.contactNumber.trim() === '') {
    errors.contactNumber = 'Contact number is required'
  } else if (!MALAYSIAN_PHONE_REGEX.test(formData.contactNumber.trim())) {
    errors.contactNumber = 'Please enter a valid Malaysian phone number (e.g., 012-3456789 or +6012-3456789)'
  }

  // Validate email
  if (!formData.email || formData.email.trim() === '') {
    errors.email = 'Email address is required'
  } else if (!isValidEmail(formData.email.trim())) {
    errors.email = 'Please enter a valid email address'
  } else if (isTempEmail(formData.email.trim())) {
    errors.email = 'Temporary email addresses are not allowed'
  }

  // Validate message
  if (!formData.message || formData.message.trim() === '') {
    errors.message = 'Message is required'
  } else if (formData.message.trim().length < 10) {
    errors.message = 'Message must be at least 10 characters'
  } else if (formData.message.trim().length > 5000) {
    errors.message = 'Message must not exceed 5000 characters'
  }

  // Validate reCAPTCHA
  if (!formData.captcha) {
    errors.captcha = 'Please complete the reCAPTCHA verification'
  }

  return errors
}

export const isValidEmail = (email) => {
  // RFC 5322 compliant email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isTempEmail = (email) => {
  const domain = email.toLowerCase().split('@')[1]
  return TEMP_EMAIL_DOMAINS.includes(domain)
}

export const MALAYSIAN_PHONE_PATTERN = MALAYSIAN_PHONE_REGEX