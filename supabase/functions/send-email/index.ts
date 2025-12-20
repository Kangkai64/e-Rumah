// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")

// interface EmailData {
//   to: string
//   name: string
//   subject: string
//   message: string
//   contactNumber?: string
//   emailType?: 'enquiry' | 'health_report_share'
// }

// const buildEnquiryEmail = (data: EmailData): string => {
//   return `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//       <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
//         <img src="https://ktwarkyeopizmmazizmw.supabase.co/storage/v1/object/public/Image%20Bucket/logo.png" alt="e-Rumah Logo" style="max-width: 100px; height: auto;" />
//         <h1 style="color: #A8202D; margin: 0 auto;">e-Rumah</h1>
//       </div>
      
//       <h2 style="color: #A8202D;">Thank you for your enquiry!</h2>
//       <p>Hi ${data.name},</p>
//       <p>We have received your enquiry and will get back to you shortly.</p>
      
//       <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
//         <h3 style="margin-top: 0; color: #161519;">Your Enquiry Details:</h3>
//         <p><strong>Subject:</strong> ${data.subject}</p>
//         <p><strong>Contact Number:</strong> ${data.contactNumber || 'Not provided'}</p>
//         <p><strong>Message:</strong></p>
//         <p style="white-space: pre-wrap;">${data.message}</p>
//       </div>
      
//       <p>Best regards,<br><strong>e-Rumah Team</strong></p>
//       <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
//       <p style="font-size: 12px; color: #666;">
//         This is an automated confirmation email. Please do not reply to this message.
//       </p>
//     </div>
//   `
// }

// const buildHealthReportShareEmail = (data: EmailData): string => {
//   return `
//     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//       <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;">
//         <img src="https://ktwarkyeopizmmazizmw.supabase.co/storage/v1/object/public/Image%20Bucket/logo.png" alt="e-Rumah Logo" style="max-width: 100px; height: auto;" />
//         <h1 style="color: #A8202D; margin: 0 auto;">e-Rumah</h1>
//       </div>
      
//       ${data.message}
      
//       <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
//       <p style="color: #999; font-size: 12px;">Best regards,<br>The e-Rumah Team</p>
//       <p style="color: #999; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
//     </div>
//   `
// }

// serve(async (req) => {
//   // CORS headers
//   const corsHeaders = {
//     'Access-Control-Allow-Origin': '*',
//     'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
//   }

//   // Handle CORS preflight
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders })
//   }

//   if (req.method !== "POST") {
//     return new Response(JSON.stringify({ error: "Method not allowed" }), {
//       status: 405,
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//     })
//   }

//   try {
//     const body = (await req.json()) as EmailData

//     // Validate required fields
//     if (!body.to || !body.name || !body.subject || !body.message) {
//       return new Response(
//         JSON.stringify({ error: "Missing required fields" }),
//         { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
//       )
//     }

//     // Determine email type and build appropriate HTML
//     const emailType = body.emailType || 'enquiry'
//     let htmlContent: string
//     let subject: string

//     if (emailType === 'health_report_share') {
//       htmlContent = buildHealthReportShareEmail(body)
//       subject = body.subject
//     } else {
//       htmlContent = buildEnquiryEmail(body)
//       subject = `Confirmation: Your Enquiry About ${body.subject}`
//     }

//     // Send email using Resend API directly
//     const resendResponse = await fetch('https://api.resend.com/emails', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${RESEND_API_KEY}`,
//       },
//       body: JSON.stringify({
//         from: 'e-Rumah <onboarding@resend.dev>',
//         to: [body.to],
//         subject: subject,
//         html: htmlContent,
//       }),
//     })

//     if (!resendResponse.ok) {
//       const errorData = await resendResponse.json()
//       throw new Error(errorData.message || 'Failed to send email')
//     }

//     const result = await resendResponse.json()

//     return new Response(
//       JSON.stringify({ success: true, id: result.id }), 
//       { 
//         status: 200,
//         headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
//       }
//     )
//   } catch (error) {
//     console.error("Error sending email:", error)
//     return new Response(
//       JSON.stringify({ success: false, error: error.message }),
//       { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
//     )
//   }
// })
