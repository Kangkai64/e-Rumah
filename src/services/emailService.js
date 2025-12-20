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

/**
 * Build customized HTML email template for health report share notification
 * @param {Object} shareData - The share notification data
 * @param {string} shareData.recipientName - Recipient's name (optional)
 * @param {string} shareData.senderName - Name of person sharing the report
 * @param {string} shareData.reportTitle - Title of the health report
 * @param {string} shareData.reportType - Type of health report
 * @param {string} shareData.shareUrl - URL to access the shared report
 * @param {string} shareData.expiryDate - When the share link expires (optional)
 * @param {string} shareData.shareType - Type of share (caregiver, family, healthcare, email)
 * @returns {string} Formatted HTML email message
 */
export const buildHealthReportShareTemplate = (shareData) => {
  const {
    recipientName,
    senderName,
    reportTitle,
    reportType,
    shareUrl,
    expiryDate,
    shareType
  } = shareData

  const expiryText = expiryDate 
    ? `This link will expire on ${new Date(expiryDate).toLocaleDateString('en-MY', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}.`
    : ''

  return `
    <h2 style="color: #A8202D;">A health report has been shared with you</h2>
    <p>Hi ${recipientName || 'User'},</p>
    <p>${senderName} has shared a health report with you on e-Rumah.</p>
    
    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #161519;">Report Details:</h3>
      <p><strong>Title:</strong> ${reportTitle}</p>
      <p><strong>Type:</strong> ${reportType}</p>
      ${shareType ? `<p><strong>Shared as:</strong> ${shareType}</p>` : ''}
    </div>

    <div style="margin: 20px 0;">
      <p><strong>Access the Report:</strong></p>
      <p><a href="${shareUrl}" style="background-color: #A8202D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Report</a></p>
    </div>

    ${expiryText ? `<p style="color: #666; font-size: 14px;">${expiryText}</p>` : ''}

    <p style="color: #666; font-size: 14px;">If you have any questions or concerns about this shared report, please contact ${senderName} directly.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">Best regards,<br>The e-Rumah Team</p>
    <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
  `.trim()
}

/**
 * Send health report share notification email
 * @param {Object} shareData - The share notification data
 * @param {string} shareData.recipientEmail - Recipient's email address
 * @param {string} shareData.recipientName - Recipient's name (optional)
 * @param {string} shareData.senderName - Name of person sharing the report
 * @param {string} shareData.reportTitle - Title of the health report
 * @param {string} shareData.reportType - Type of health report
 * @param {string} shareData.shareUrl - URL to access the shared report
 * @param {string} shareData.expiryDate - When the share link expires
 * @param {string} shareData.shareType - Type of share (caregiver, family, healthcare, email)
 * @returns {Promise<Object>} Response from email service
 */
export const sendHealthReportShareEmail = async (shareData) => {
  try {
    const {
      recipientEmail,
      recipientName,
      senderName,
      reportTitle,
      reportType,
      shareUrl,
      expiryDate,
      shareType
    } = shareData

    // Build email subject
    const subject = `${senderName} has shared a health report with you`

    // Build email message using the customizable template
    const message = buildHealthReportShareTemplate(shareData)

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        name: recipientName || 'User',
        subject: subject,
        message: message,
        emailType: 'health_report_share'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Email service error: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, ...result }
  } catch (error) {
    console.error('Error sending health report share email:', error)
    // Don't throw - allow share to succeed even if email fails
    return { success: false, error: error.message }
  }
}
