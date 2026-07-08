// List of common temporary/disposable email domains
export const TEMP_EMAIL_DOMAINS = [
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

export const isTempEmail = (email) => {
  if (!email) return false
  const domain = email.toLowerCase().split('@')[1]
  return TEMP_EMAIL_DOMAINS.includes(domain)
}
