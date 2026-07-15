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

/**
 * Build HTML email template for a newly scheduled property valuation
 * @param {Object} data
 * @param {string} data.recipientName - Applicant's name (optional)
 * @param {string} data.scheduledDate - ISO date/time of the appointment
 * @param {string} data.valuerName - Name of the assigned valuer (optional)
 * @param {string} data.locationNotes - Notes for the applicant (optional)
 * @returns {string} Formatted HTML email message
 */
export const buildValuationScheduledTemplate = (data) => {
  const { recipientName, scheduledDate, valuerName, locationNotes } = data

  const formattedDate = scheduledDate
    ? new Date(scheduledDate).toLocaleString('en-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'To be confirmed'

  return `
    <h2 style="color: #A8202D;">Your property valuation has been scheduled</h2>
    <p>Hi ${recipientName || 'Applicant'},</p>
    <p>We've arranged an official property valuation as part of your e-Rumah application.</p>

    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #161519;">Appointment Details:</h3>
      <p><strong>Date & Time:</strong> ${formattedDate}</p>
      ${valuerName ? `<p><strong>Valuer:</strong> ${valuerName}</p>` : ''}
      ${locationNotes ? `<p><strong>Notes:</strong> ${locationNotes}</p>` : ''}
    </div>

    <p>Please ensure someone is available at the property to grant access on the scheduled date.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">Best regards,<br>The e-Rumah Team</p>
    <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
  `.trim()
}

/**
 * Send property valuation scheduled notification email
 * @param {Object} data
 * @param {string} data.recipientEmail - Recipient's email address
 * @param {string} data.recipientName - Recipient's name (optional)
 * @param {string} data.scheduledDate - ISO date/time of the appointment
 * @param {string} data.valuerName - Name of the assigned valuer (optional)
 * @param {string} data.locationNotes - Notes for the applicant (optional)
 * @returns {Promise<Object>} Response from email service
 */
export const sendValuationScheduledEmail = async (data) => {
  try {
    const { recipientEmail, recipientName } = data

    const subject = 'Your property valuation has been scheduled'
    const message = buildValuationScheduledTemplate(data)

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        name: recipientName || 'Applicant',
        subject: subject,
        message: message,
        emailType: 'valuation_scheduled'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Email service error: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, ...result }
  } catch (error) {
    console.error('Error sending valuation scheduled email:', error)
    // Don't throw - allow scheduling to succeed even if email fails
    return { success: false, error: error.message }
  }
}

/**
 * Build HTML email template for a completed property valuation
 * @param {Object} data
 * @param {string} data.recipientName - Applicant's name (optional)
 * @param {number} data.resultValue - The valuer's assessed property value
 * @returns {string} Formatted HTML email message
 */
export const buildValuationCompletedTemplate = (data) => {
  const { recipientName, resultValue } = data

  const formattedValue = typeof resultValue === 'number'
    ? `RM ${resultValue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'N/A'

  return `
    <h2 style="color: #A8202D;">Your property valuation is complete</h2>
    <p>Hi ${recipientName || 'Applicant'},</p>
    <p>The valuer has completed the property valuation for your e-Rumah application.</p>

    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #161519;">Valuation Result:</h3>
      <p><strong>Assessed Value:</strong> ${formattedValue}</p>
    </div>

    <p>The valuation report has been added to your application. You can review it from your application status page.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">Best regards,<br>The e-Rumah Team</p>
    <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
  `.trim()
}

/**
 * Send property valuation completed notification email
 * @param {Object} data
 * @param {string} data.recipientEmail - Recipient's email address
 * @param {string} data.recipientName - Recipient's name (optional)
 * @param {number} data.resultValue - The valuer's assessed property value
 * @returns {Promise<Object>} Response from email service
 */
export const sendValuationCompletedEmail = async (data) => {
  try {
    const { recipientEmail, recipientName } = data

    const subject = 'Your property valuation is complete'
    const message = buildValuationCompletedTemplate(data)

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        name: recipientName || 'Applicant',
        subject: subject,
        message: message,
        emailType: 'valuation_completed'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Email service error: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, ...result }
  } catch (error) {
    console.error('Error sending valuation completed email:', error)
    // Don't throw - allow completion to succeed even if email fails
    return { success: false, error: error.message }
  }
}

/**
 * Build HTML email template notifying an applicant their application is
 * missing a valuation report
 * @param {Object} data
 * @param {string} data.recipientName - Applicant's name (optional)
 * @returns {string} Formatted HTML email message
 */
export const buildValuationMissingTemplate = (data) => {
  const { recipientName } = data

  return `
    <h2 style="color: #A8202D;">Your application is missing a valuation report</h2>
    <p>Hi ${recipientName || 'Applicant'},</p>
    <p>We noticed your e-Rumah application does not yet have a Valuation Report on file. This document is required before your application can be processed further.</p>

    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p>Our team will arrange an official property valuation and get in touch to schedule a visit. You'll be notified by email once it's scheduled, and you can check your application status page for the latest details.</p>
    </div>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">Best regards,<br>The e-Rumah Team</p>
    <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
  `.trim()
}

/**
 * Send "valuation report missing" notification email to the applicant
 * @param {Object} data
 * @param {string} data.recipientEmail - Applicant's email address
 * @param {string} data.recipientName - Applicant's name (optional)
 * @returns {Promise<Object>} Response from email service
 */
export const sendValuationMissingEmail = async (data) => {
  try {
    const { recipientEmail, recipientName } = data

    const subject = 'Your application is missing a valuation report'
    const message = buildValuationMissingTemplate(data)

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        name: recipientName || 'Applicant',
        subject: subject,
        message: message,
        emailType: 'valuation_missing'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Email service error: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, ...result }
  } catch (error) {
    console.error('Error sending valuation missing email:', error)
    // Don't throw - allow the caller to decide how to surface the failure
    return { success: false, error: error.message }
  }
}

/**
 * Build HTML email template notifying a provider that an application has
 * opened for bidding
 * @param {Object} data
 * @param {string} data.recipientName - Provider's company name (optional)
 * @param {string} data.propertyType - Type of property (optional)
 * @param {string} data.district - Property district (optional)
 * @param {number} data.approvedAmount - The applicant's approved ceiling amount
 * @returns {string} Formatted HTML email message
 */
export const buildAuctionOpenTemplate = (data) => {
  const { recipientName, propertyType, district, approvedAmount } = data

  const formattedAmount = typeof approvedAmount === 'number'
    ? `RM ${approvedAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'N/A'

  return `
    <h2 style="color: #A8202D;">A new application is open for bidding</h2>
    <p>Hi ${recipientName || 'Provider'},</p>
    <p>An e-Rumah application has been opened for provider bidding.</p>

    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #161519;">Application Summary:</h3>
      ${propertyType ? `<p><strong>Property Type:</strong> ${propertyType}</p>` : ''}
      ${district ? `<p><strong>District:</strong> ${district}</p>` : ''}
      <p><strong>Indicative Ceiling:</strong> ${formattedAmount}</p>
    </div>

    <p>Log in to the provider portal to review the application and submit your offer.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">Best regards,<br>The e-Rumah Team</p>
    <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
  `.trim()
}

/**
 * Send "application open for bidding" notification email to a provider
 * @param {Object} data
 * @param {string} data.recipientEmail - Provider's email address
 * @param {string} data.recipientName - Provider's company name (optional)
 * @param {string} data.propertyType - Type of property (optional)
 * @param {string} data.district - Property district (optional)
 * @param {number} data.approvedAmount - The applicant's approved ceiling amount
 * @returns {Promise<Object>} Response from email service
 */
export const sendAuctionOpenEmail = async (data) => {
  try {
    const { recipientEmail, recipientName } = data

    const subject = 'A new application is open for bidding on e-Rumah'
    const message = buildAuctionOpenTemplate(data)

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        name: recipientName || 'Provider',
        subject: subject,
        message: message,
        emailType: 'auction_open'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Email service error: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, ...result }
  } catch (error) {
    console.error('Error sending auction open email:', error)
    // Don't throw - allow the auction to open even if email fails
    return { success: false, error: error.message }
  }
}

/**
 * Build HTML email template notifying a provider that their offer was accepted
 * @param {Object} data
 * @param {string} data.recipientName - Provider's company name (optional)
 * @param {number} data.offerAmount - The accepted offer amount
 * @returns {string} Formatted HTML email message
 */
export const buildOfferAcceptedTemplate = (data) => {
  const { recipientName, offerAmount } = data

  const formattedAmount = typeof offerAmount === 'number'
    ? `RM ${offerAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : 'N/A'

  return `
    <h2 style="color: #A8202D;">Your offer has been accepted</h2>
    <p>Hi ${recipientName || 'Provider'},</p>
    <p>The applicant has accepted your reverse mortgage offer of ${formattedAmount}.</p>

    <p>e-Rumah admin will be in touch to proceed with the next steps.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">Best regards,<br>The e-Rumah Team</p>
    <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
  `.trim()
}

/**
 * Send "offer accepted" notification email to the winning provider
 * @param {Object} data
 * @param {string} data.recipientEmail - Provider's email address
 * @param {string} data.recipientName - Provider's company name (optional)
 * @param {number} data.offerAmount - The accepted offer amount
 * @returns {Promise<Object>} Response from email service
 */
export const sendOfferAcceptedEmail = async (data) => {
  try {
    const { recipientEmail, recipientName } = data

    const subject = 'Your reverse mortgage offer has been accepted'
    const message = buildOfferAcceptedTemplate(data)

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        name: recipientName || 'Provider',
        subject: subject,
        message: message,
        emailType: 'offer_accepted'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Email service error: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, ...result }
  } catch (error) {
    console.error('Error sending offer accepted email:', error)
    // Don't throw - allow acceptance to succeed even if email fails
    return { success: false, error: error.message }
  }
}

/**
 * Build HTML email template notifying an applicant their nominee change was approved
 * @param {Object} data
 * @param {string} data.recipientName - Applicant's name (optional)
 * @returns {string} Formatted HTML email message
 */
export const buildNomineeChangeApprovedTemplate = (data) => {
  const { recipientName } = data

  return `
    <h2 style="color: #A8202D;">Your nominee change has been approved</h2>
    <p>Hi ${recipientName || 'Applicant'},</p>
    <p>Our support team has reviewed and approved the replacement nominee you submitted for your e-Rumah application. Your application is no longer flagged for this issue.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">Best regards,<br>The e-Rumah Team</p>
    <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
  `.trim()
}

/**
 * Send "nominee change approved" notification email to the applicant
 * @param {Object} data
 * @param {string} data.recipientEmail - Applicant's email address
 * @param {string} data.recipientName - Applicant's name (optional)
 * @returns {Promise<Object>} Response from email service
 */
export const sendNomineeChangeApprovedEmail = async (data) => {
  try {
    const { recipientEmail, recipientName } = data

    const subject = 'Your nominee change has been approved'
    const message = buildNomineeChangeApprovedTemplate(data)

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        name: recipientName || 'Applicant',
        subject: subject,
        message: message,
        emailType: 'nominee_change_approved'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Email service error: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, ...result }
  } catch (error) {
    console.error('Error sending nominee change approved email:', error)
    // Don't throw - allow the approval to succeed even if email fails
    return { success: false, error: error.message }
  }
}

/**
 * Build HTML email template notifying an applicant their nominee change was rejected
 * @param {Object} data
 * @param {string} data.recipientName - Applicant's name (optional)
 * @param {string} data.rejectionReason - Reason the change was rejected
 * @returns {string} Formatted HTML email message
 */
export const buildNomineeChangeRejectedTemplate = (data) => {
  const { recipientName, rejectionReason } = data

  return `
    <h2 style="color: #A8202D;">Your nominee change requires attention</h2>
    <p>Hi ${recipientName || 'Applicant'},</p>
    <p>Our support team has reviewed the replacement nominee you submitted for your e-Rumah application and was unable to approve it.</p>

    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #161519;">Reason:</h3>
      <p>${rejectionReason || 'No reason provided.'}</p>
    </div>

    <p>Please log in to your e-Rumah account and submit an updated nominee.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    <p style="color: #999; font-size: 12px;">Best regards,<br>The e-Rumah Team</p>
    <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
  `.trim()
}

/**
 * Send "nominee change rejected" notification email to the applicant
 * @param {Object} data
 * @param {string} data.recipientEmail - Applicant's email address
 * @param {string} data.recipientName - Applicant's name (optional)
 * @param {string} data.rejectionReason - Reason the change was rejected
 * @returns {Promise<Object>} Response from email service
 */
export const sendNomineeChangeRejectedEmail = async (data) => {
  try {
    const { recipientEmail, recipientName } = data

    const subject = 'Your nominee change requires attention'
    const message = buildNomineeChangeRejectedTemplate(data)

    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        name: recipientName || 'Applicant',
        subject: subject,
        message: message,
        emailType: 'nominee_change_rejected'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Email service error: ${response.statusText}`)
    }

    const result = await response.json()
    return { success: true, ...result }
  } catch (error) {
    console.error('Error sending nominee change rejected email:', error)
    // Don't throw - allow the rejection to succeed even if email fails
    return { success: false, error: error.message }
  }
}
