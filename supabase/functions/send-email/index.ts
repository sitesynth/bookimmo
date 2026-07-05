import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'

type SupportedLanguage = 'de' | 'en' | 'fr' | 'it' | 'nl'

type HookPayload = {
  user: {
    email: string
    new_email?: string
    user_metadata?: {
      profile?: {
        preferredLanguage?: SupportedLanguage
      }
    }
  }
  email_data: {
    token: string
    token_hash: string
    redirect_to?: string
    email_action_type: string
    site_url?: string
    token_new?: string
    token_hash_new?: string
  }
}

type EmailJob = {
  to: string
  token: string
  tokenHash: string
  actionType: string
  redirectTo: string
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const HOOK_SECRET = (Deno.env.get('SEND_EMAIL_HOOK_SECRET') || '').replace('v1,whsec_', '')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const DEFAULT_APP_URL = Deno.env.get('BOOKIMMO_APP_URL') || 'https://book.immo'
const FROM_EMAIL = Deno.env.get('BOOKIMMO_FROM_EMAIL') || 'Bookimmo <noreply@book.immo>'
const LOGO_URL = `${DEFAULT_APP_URL.replace(/\/$/, '')}/apple-touch-icon.png`

const COPY = {
  en: {
    brand: 'Bookimmo',
    footer: 'Bookimmo real estate workspace',
    signup: {
      preview: 'Confirm your Bookimmo account',
      subject: 'Confirm your Bookimmo account',
      title: 'Confirm your email',
      intro: 'Your Bookimmo real estate workspace is almost ready. Confirm your email address to activate your account.',
      cta: 'Confirm account',
      otpLabel: 'Confirmation code',
    },
    recovery: {
      preview: 'Reset your Bookimmo password',
      subject: 'Reset your Bookimmo password',
      title: 'Reset your password',
      intro: 'Use the secure link below to set a new password for your Bookimmo account.',
      cta: 'Reset password',
      otpLabel: 'Recovery code',
    },
    magiclink: {
      preview: 'Sign in to Bookimmo',
      subject: 'Your Bookimmo sign-in link',
      title: 'Sign in to Bookimmo',
      intro: 'Use the secure button below to sign in to your Bookimmo account.',
      cta: 'Sign in',
      otpLabel: 'One-time sign-in code',
    },
    invite: {
      preview: 'You are invited to Bookimmo',
      subject: 'Your Bookimmo invitation',
      title: 'You are invited',
      intro: 'An account has been prepared for you in Bookimmo. Confirm your email to continue.',
      cta: 'Accept invitation',
      otpLabel: 'Invitation code',
    },
    email_change: {
      preview: 'Confirm your email change',
      subject: 'Confirm your email change',
      title: 'Confirm your email change',
      intro: 'Use the secure link below to confirm the email change for your Bookimmo account.',
      cta: 'Confirm change',
      otpLabel: 'Confirmation code',
    },
    fallback: {
      preview: 'Bookimmo account action',
      subject: 'Bookimmo account action required',
      title: 'Account action required',
      intro: 'Use the secure link below to continue with your Bookimmo account action.',
      cta: 'Continue',
      otpLabel: 'Verification code',
    },
    secondary: 'If the button does not open, use this direct link:',
    directLinkLabel: 'Open secure Bookimmo confirmation',
    ignore: 'If you did not request this email, you can safely ignore it.',
  },
  de: {
    brand: 'Bookimmo',
    footer: 'Bookimmo Immobilien-Workspace',
    signup: {
      preview: 'Bestaetige dein Bookimmo Konto',
      subject: 'Bestaetige dein Bookimmo Konto',
      title: 'E-Mail bestaetigen',
      intro: 'Dein Bookimmo Immobilien-Workspace ist fast bereit. Bestaetige deine E-Mail-Adresse, um dein Konto zu aktivieren.',
      cta: 'Konto bestaetigen',
      otpLabel: 'Bestaetigungscode',
    },
    recovery: {
      preview: 'Setze dein Bookimmo Passwort zurueck',
      subject: 'Setze dein Bookimmo Passwort zurueck',
      title: 'Passwort zuruecksetzen',
      intro: 'Nutze den sicheren Link unten, um ein neues Passwort fuer dein Bookimmo Konto festzulegen.',
      cta: 'Passwort zuruecksetzen',
      otpLabel: 'Recovery-Code',
    },
    magiclink: {
      preview: 'Bei Bookimmo anmelden',
      subject: 'Dein Bookimmo Login-Link',
      title: 'Bei Bookimmo anmelden',
      intro: 'Nutze den sicheren Button unten, um dich in dein Bookimmo Konto einzuloggen.',
      cta: 'Jetzt anmelden',
      otpLabel: 'Einmaliger Login-Code',
    },
    invite: {
      preview: 'Deine Einladung zu Bookimmo',
      subject: 'Deine Bookimmo Einladung',
      title: 'Du bist eingeladen',
      intro: 'Fuer dich wurde ein Konto bei Bookimmo vorbereitet. Bestaetige deine E-Mail-Adresse, um fortzufahren.',
      cta: 'Einladung annehmen',
      otpLabel: 'Einladungscode',
    },
    email_change: {
      preview: 'Bestaetige deine E-Mail-Aenderung',
      subject: 'Bestaetige deine E-Mail-Aenderung',
      title: 'E-Mail-Aenderung bestaetigen',
      intro: 'Nutze den sicheren Link unten, um die E-Mail-Aenderung fuer dein Bookimmo Konto zu bestaetigen.',
      cta: 'Aenderung bestaetigen',
      otpLabel: 'Bestaetigungscode',
    },
    fallback: {
      preview: 'Bookimmo Kontoaktion',
      subject: 'Aktion fuer dein Bookimmo Konto erforderlich',
      title: 'Aktion erforderlich',
      intro: 'Nutze den sicheren Link unten, um mit deiner Bookimmo Kontoaktion fortzufahren.',
      cta: 'Fortfahren',
      otpLabel: 'Verifizierungscode',
    },
    secondary: 'Falls der Button nicht funktioniert, nutze bitte diesen direkten Link:',
    directLinkLabel: 'Sichere Bookimmo-Bestaetigung oeffnen',
    ignore: 'Wenn du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.',
  },
} as const

function getLanguage(payload: HookPayload): SupportedLanguage {
  const candidate = payload.user.user_metadata?.profile?.preferredLanguage
  return candidate && candidate in COPY ? candidate : 'en'
}

function getActionCopy(language: SupportedLanguage, actionType: string) {
  const dictionary = COPY[language] || COPY.en
  return dictionary[actionType as keyof typeof dictionary] || dictionary.fallback
}

function buildAppUrl(pathname: string) {
  return new URL(pathname, `${DEFAULT_APP_URL.replace(/\/$/, '')}/`).toString()
}

function resolveRedirectTo({
  actionType,
  language,
  redirectTo,
}: {
  actionType: string
  language: SupportedLanguage
  redirectTo?: string
}) {
  const fallbackDashboard = buildAppUrl(`/${language}/dashboard-home`)
  const fallbackUpdatePassword = buildAppUrl(`/${language}/update-password`)

  if (!redirectTo) {
    return actionType === 'recovery' ? fallbackUpdatePassword : fallbackDashboard
  }

  try {
    const target = new URL(redirectTo)
    const appOrigin = new URL(DEFAULT_APP_URL).origin

    if (target.origin === appOrigin) {
      const cleanPath = target.pathname.replace(/\/+$/, '') || '/'

      if (actionType === 'recovery') {
        if (cleanPath === '/' || cleanPath === '') return fallbackUpdatePassword
        return target.toString()
      }

      if (cleanPath === '/' || cleanPath === '') {
        return fallbackDashboard
      }

      return target.toString()
    }

    return target.toString()
  } catch {
    return actionType === 'recovery' ? fallbackUpdatePassword : fallbackDashboard
  }
}

function buildVerifyUrl(job: EmailJob) {
  const params = new URLSearchParams({
    token: job.tokenHash,
    type: job.actionType,
    redirect_to: job.redirectTo,
  })

  return `${SUPABASE_URL}/auth/v1/verify?${params.toString()}`
}

function buildEmailJobs(payload: HookPayload): EmailJob[] {
  const actionType = payload.email_data.email_action_type
  const language = getLanguage(payload)
  const redirectTo = resolveRedirectTo({
    actionType,
    language,
    redirectTo: payload.email_data.redirect_to,
  })

  if (actionType !== 'email_change') {
    return [{
      to: payload.user.email,
      token: payload.email_data.token,
      tokenHash: payload.email_data.token_hash,
      actionType,
      redirectTo,
    }]
  }

  const jobs: EmailJob[] = []

  if (payload.user.email && payload.email_data.token && payload.email_data.token_hash_new) {
    jobs.push({
      to: payload.user.email,
      token: payload.email_data.token,
      tokenHash: payload.email_data.token_hash_new,
      actionType,
      redirectTo,
    })
  }

  if (payload.user.new_email && payload.email_data.token_new && payload.email_data.token_hash) {
    jobs.push({
      to: payload.user.new_email,
      token: payload.email_data.token_new,
      tokenHash: payload.email_data.token_hash,
      actionType,
      redirectTo,
    })
  }

  return jobs
}

function renderEmailHtml({
  language,
  actionType,
  verifyUrl,
  token,
}: {
  language: SupportedLanguage
  actionType: string
  verifyUrl: string
  token: string
}) {
  const baseCopy = COPY[language] || COPY.en
  const copy = getActionCopy(language, actionType)

  return `
  <!doctype html>
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
            <div style="display:flex;align-items:center;gap:12px;">
              <img src="${LOGO_URL}" alt="${baseCopy.brand}" width="44" height="44" style="display:block;width:44px;height:44px;border-radius:12px;" />
              <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(25,26,32,0.54);">${baseCopy.brand}</div>
            </div>
            <h1 style="margin:12px 0 0;font-size:30px;line-height:1.1;font-family:'Bricolage Grotesque',Inter,Arial,sans-serif;font-weight:600;color:#191a20;">${copy.title}</h1>
          </div>
          <div style="padding:28px 32px 32px;">
            <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:rgba(25,26,32,0.74);">${copy.intro}</p>
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 20px;border-radius:14px;background:#191a20;color:#f5f5f5;text-decoration:none;font-size:14px;font-weight:600;">
              ${copy.cta}
            </a>
            <p style="margin:24px 0 10px;font-size:13px;line-height:1.6;color:rgba(25,26,32,0.6);">${baseCopy.secondary}</p>
            <p style="margin:0 0 24px;font-size:13px;line-height:1.6;">
              <a href="${verifyUrl}" style="color:#191a20;font-weight:600;text-decoration:underline;">${baseCopy.directLinkLabel}</a>
            </p>
            <div style="padding:18px 20px;border-radius:18px;background:#f8f6f1;border:1px solid rgba(25,26,32,0.08);">
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(25,26,32,0.52);margin-bottom:8px;">${copy.otpLabel}</div>
              <div style="font-size:28px;font-weight:700;letter-spacing:0.18em;color:#191a20;">${token}</div>
            </div>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:rgba(25,26,32,0.54);">${baseCopy.ignore}</p>
          </div>
        </div>
        <p style="margin:16px 4px 0;font-size:12px;line-height:1.5;color:rgba(25,26,32,0.45);text-align:center;">
          ${baseCopy.footer}
        </p>
      </div>
    </body>
  </html>
  `
}

async function sendWithResend({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
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
    const body = await response.text()
    throw new Error(`Resend error: ${response.status} ${body}`)
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('not allowed', { status: 400 })
  }

  if (!RESEND_API_KEY || !HOOK_SECRET || !SUPABASE_URL) {
    return Response.json(
      {
        error: {
          message: 'Missing RESEND_API_KEY, SEND_EMAIL_HOOK_SECRET or SUPABASE_URL',
        },
      },
      { status: 500 },
    )
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    const webhook = new Webhook(HOOK_SECRET)
    const verified = webhook.verify(payload, headers) as HookPayload
    const language = getLanguage(verified)
    const jobs = buildEmailJobs(verified)

    for (const job of jobs) {
      const actionCopy = getActionCopy(language, job.actionType)
      const verifyUrl = buildVerifyUrl(job)
      const html = renderEmailHtml({
        language,
        actionType: job.actionType,
        verifyUrl,
        token: job.token,
      })

      await sendWithResend({
        to: job.to,
        subject: actionCopy.subject,
        html,
      })
    }

    return Response.json({})
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown send-email hook error'
    return Response.json(
      {
        error: {
          message,
        },
      },
      { status: 401 },
    )
  }
})
