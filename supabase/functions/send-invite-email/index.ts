import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

// Resend API endpoint
const RESEND_API_URL = "https://api.resend.com/emails"

interface InvitePayload {
  to: string
  token: string
  teamName: string
  inviterName?: string // Optional inviter name
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  try {
    // --- Environment Variable Check ---
    const resendApiKey = Deno.env.get("RESEND_API_KEY")
    const appBaseUrl = Deno.env.get("APP_BASE_URL")
    const fromEmail = Deno.env.get("EMAIL_FROM_ADDRESS")

    if (!resendApiKey || !appBaseUrl || !fromEmail) {
      console.error(
        "Missing environment variables: RESEND_API_KEY, APP_BASE_URL, or EMAIL_FROM_ADDRESS",
      )
      return new Response(
        JSON.stringify({
          error:
            "Server configuration error: Missing email environment variables.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // --- Parse Request Body ---
    const {
      to,
      token,
      teamName,
      inviterName = "Someone", // Default if not provided
    }: InvitePayload = await req.json()

    if (!to || !token || !teamName) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: to, token, teamName",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // --- Construct Invite Link ---
    // Ensure no double slashes if appBaseUrl ends with /
    const baseUrl = appBaseUrl.endsWith("/")
      ? appBaseUrl.slice(0, -1)
      : appBaseUrl
    const inviteLink = `${baseUrl}/accept-invite?token=${token}`

    // --- Construct Email Content ---
    // Consider using a more robust HTML templating library for complex emails
    const subject = `You're invited to join the ${teamName} team!`
    const bodyHtml = `
      <p>Hi there,</p>
      <p>${inviterName} has invited you to join the <strong>${teamName}</strong> team on our platform.</p>
      <p>Click the link below to accept the invitation:</p>
      <p><a href="${inviteLink}">Accept Invitation</a></p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
      <p>Thanks,</p>
      <p>The Team</p>
    `
    const bodyText = `
      Hi there,\n
      ${inviterName} has invited you to join the ${teamName} team on our platform.\n
      Accept the invitation here: ${inviteLink}\n
      If you did not expect this invitation, you can safely ignore this email.\n
      Thanks,\nThe Team
    `

    // --- Send Email via Resend ---
    const resendPayload = {
      from: fromEmail, // Use configured sender address
      to: [to], // Resend expects an array
      subject: subject,
      html: bodyHtml,
      text: bodyText,
    }

    const resendResponse = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    })

    // --- Handle Resend Response ---
    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text()
      console.error(`Resend API error (${resendResponse.status}): ${errorBody}`)
      return new Response(
        JSON.stringify({
          error: `Failed to send email via Resend: ${errorBody}`,
        }),
        {
          status: 502, // Bad Gateway (error communicating with upstream service)
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // const responseData = await resendResponse.json(); // Contains the ID of the sent email

    // --- Success ---
    return new Response(
      JSON.stringify({ success: true, message: "Invitation email sent." }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    )
  } catch (error) {
    console.error("Error processing request:", error)

    // Check the type of error before accessing properties
    let errorMessage = "Internal Server Error"
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
