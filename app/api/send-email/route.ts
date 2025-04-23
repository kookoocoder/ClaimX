import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { Buffer } from 'buffer'

// Set up OAuth2 client for Gmail API
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
)
if (!process.env.GOOGLE_REFRESH_TOKEN) {
  console.warn('Missing GOOGLE_REFRESH_TOKEN in env')
}
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN })
const gmail = google.gmail({ version: 'v1', auth: oAuth2Client })

export async function POST(request: Request) {
  try {
    const { To, Subject, Message } = await request.json()
    if (!To || !Subject || !Message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    // Check OAuth2 creds
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, GOOGLE_REDIRECT_URI } = process.env
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN || !GOOGLE_REDIRECT_URI) {
      return NextResponse.json({ error: 'Gmail OAuth2 credentials missing' }, { status: 500 })
    }
    // Construct raw email
    const from = process.env.GMAIL_USER || 'me'
    const rawMessage = `From: ${from}\r\nTo: ${To}\r\nSubject: ${Subject}\r\n\r\n${Message}`
    const encodedMessage = Buffer.from(rawMessage).toString('base64url')
    // Send via Gmail API
    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encodedMessage } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Error in send-email API:', err)
    return NextResponse.json({ error: err.message || 'Email send failed' }, { status: 500 })
  }
}
