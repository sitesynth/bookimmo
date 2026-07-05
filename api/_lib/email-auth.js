import { loadLocalEnv } from './env.js'

loadLocalEnv()

const APP_URL = process.env.BOOKIMMO_APP_URL || 'https://book.immo'
const FROM_EMAIL = process.env.BOOKIMMO_FROM_EMAIL || 'Bookimmo <noreply@book.immo>'
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.RESEND_API || ''
const LOGO_URL = `${APP_URL.replace(/\/$/, '')}/email-logo.png`

const COPY = {
  en: {
    brand: 'Bookimmo',
    footer: 'Bookimmo real estate workspace',
    verify: {
      subject: 'Confirm your Bookimmo account',
      title: 'Confirm your email',
      intro: 'Your Bookimmo real estate workspace is almost ready. Confirm your email address to activate your account.',
      cta: 'Confirm account',
      secondary: 'If the button does not open, use this direct link:',
      directLinkLabel: 'Open secure Bookimmo confirmation',
      ignore: 'If you did not request this email, you can safely ignore it.',
    },
    reset: {
      subject: 'Reset your Bookimmo password',
      title: 'Reset your password',
      intro: 'Use the secure link below to set a new password for your Bookimmo account.',
      cta: 'Reset password',
      secondary: 'If the button does not open, use this direct link:',
      directLinkLabel: 'Open secure Bookimmo reset',
      ignore: 'If you did not request this email, you can safely ignore it.',
    },
  },
  de: {
    brand: 'Bookimmo',
    footer: 'Bookimmo Immobilien-Workspace',
    verify: {
      subject: 'Bestaetige dein Bookimmo Konto',
      title: 'E-Mail bestaetigen',
      intro: 'Dein Bookimmo Immobilien-Workspace ist fast bereit. Bestaetige deine E-Mail-Adresse, um dein Konto zu aktivieren.',
      cta: 'Konto bestaetigen',
      secondary: 'Falls der Button nicht funktioniert, nutze bitte diesen direkten Link:',
      directLinkLabel: 'Sichere Bookimmo-Bestaetigung oeffnen',
      ignore: 'Wenn du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.',
    },
    reset: {
      subject: 'Setze dein Bookimmo Passwort zurueck',
      title: 'Passwort zuruecksetzen',
      intro: 'Nutze den sicheren Link unten, um ein neues Passwort fuer dein Bookimmo Konto festzulegen.',
      cta: 'Passwort zuruecksetzen',
      secondary: 'Falls der Button nicht funktioniert, nutze bitte diesen direkten Link:',
      directLinkLabel: 'Sicheren Reset-Link oeffnen',
      ignore: 'Wenn du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.',
    },
  },
}

function languageCopy(language = 'en') {
  return COPY[language] || COPY.en
}

function renderEmailHtml({ language, mode, url }) {
  const copy = languageCopy(language)[mode]
  const base = languageCopy(language)

  return `<!doctype html>
  <html lang="${language}">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${copy.subject}</title>
    </head>
    <body style="margin:0;padding:0;background:#f5f2ea;font-family:Inter,Arial,sans-serif;color:#191a20;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;">
        <div style="background:#ffffff;border:1px solid rgba(25,26,32,0.08);border-radius:24px;overflow:hidden;box-shadow:0 24px 64px rgba(25,26,32,0.08);">
          <div style="padding:32px 32px 20px;background:linear-gradient(135deg,#fffaf0 0%,#efe7d8 100%);border-bottom:1px solid rgba(25,26,32,0.08);">
            <img src="${LOGO_URL}" alt="${base.brand}" width="315" height="44" style="display:block;width:220px;height:auto;" />
            <h1 style="margin:12px 0 0;font-size:30px;line-height:1.1;font-family:'Bricolage Grotesque',Inter,Arial,sans-serif;font-weight:600;color:#191a20;">${copy.title}</h1>
          </div>
          <div style="padding:28px 32px 32px;">
            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:rgba(25,26,32,0.74);">${copy.intro}</p>
            <a href="${url}" style="display:inline-block;padding:14px 20px;border-radius:14px;background:#191a20;color:#f5f5f5;text-decoration:none;font-size:14px;font-weight:600;">
              ${copy.cta}
            </a>
            <p style="margin:24px 0 10px;font-size:13px;line-height:1.6;color:rgba(25,26,32,0.6);">${copy.secondary}</p>
            <p style="margin:0 0 24px;font-size:13px;line-height:1.6;">
              <a href="${url}" style="color:#191a20;font-weight:600;text-decoration:underline;">${copy.directLinkLabel}</a>
            </p>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:rgba(25,26,32,0.54);">${copy.ignore}</p>
          </div>
        </div>
        <p style="margin:16px 4px 0;font-size:12px;line-height:1.5;color:rgba(25,26,32,0.45);text-align:center;">
          ${base.footer}
        </p>
      </div>
    </body>
  </html>`
}

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY missing')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    throw new Error(`Resend error ${response.status}: ${await response.text()}`)
  }
}

export async function sendVerifyEmail({ email, language = 'en', token }) {
  const url = `${APP_URL.replace(/\/$/, '')}/${language}/auth/callback?token=${encodeURIComponent(token)}`
  const html = renderEmailHtml({ language, mode: 'verify', url })
  await sendEmail({
    to: email,
    subject: languageCopy(language).verify.subject,
    html,
  })
}

export async function sendPasswordResetEmail({ email, language = 'en', token }) {
  const url = `${APP_URL.replace(/\/$/, '')}/${language}/update-password?token=${encodeURIComponent(token)}`
  const html = renderEmailHtml({ language, mode: 'reset', url })
  await sendEmail({
    to: email,
    subject: languageCopy(language).reset.subject,
    html,
  })
}
