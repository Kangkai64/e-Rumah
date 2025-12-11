/**
 * Email service for sending enquiry confirmations using Supabase Edge Functions
 */

const SUPABASE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Send enquiry confirmation email to user
 * @param {Object} enquiryData - The enquiry form data
 * @param {string} enquiryData.name - User's name
 * @param {string} enquiryData.email - User's email
 * @param {string} enquiryData.contactNumber - User's contact number
 * @param {string} enquiryData.subject - Enquiry subject
 * @param {string} enquiryData.message - Enquiry message
 * @returns {Promise<Object>} Response from email service
 */
export const sendEnquiryEmail = async (enquiryData) => {
  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: enquiryData.email,
        name: enquiryData.name,
        contactNumber: enquiryData.contactNumber,
        subject: enquiryData.subject,
        message: enquiryData.message,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Email service error: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, ...result }
  } catch (error) {
    console.error('Error sending enquiry email:', error)
    // Don't throw error here - allow form submission to succeed even if email fails
    // Log for debugging but inform user
    return { success: false, error: error.message }
  }
}
