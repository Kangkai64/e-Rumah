// src/services/settingsService.js
// Service to get and set company contact info (email and phone)

const CONTACT_EMAIL_KEY = 'companyContactEmail';
const CONTACT_PHONE_KEY = 'companyContactPhone';

// Default values (can be changed in the settings UI)
const DEFAULT_EMAIL = 'ssb@erumah.com.my';
const DEFAULT_PHONE = '03-2367 8888';

export function getCompanyContactInfo() {
  const email = localStorage.getItem(CONTACT_EMAIL_KEY) || DEFAULT_EMAIL;
  const phone = localStorage.getItem(CONTACT_PHONE_KEY) || DEFAULT_PHONE;
  return { email, phone };
}

export function setCompanyContactInfo({ email, phone }) {
  if (email) localStorage.setItem(CONTACT_EMAIL_KEY, email);
  if (phone) localStorage.setItem(CONTACT_PHONE_KEY, phone);
}

export function clearCompanyContactInfo() {
  localStorage.removeItem(CONTACT_EMAIL_KEY);
  localStorage.removeItem(CONTACT_PHONE_KEY);
}
