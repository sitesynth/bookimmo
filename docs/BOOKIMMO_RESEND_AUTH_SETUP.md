# Bookimmo Resend Auth Setup

This project now includes a Supabase Auth `Send Email Hook` at:

- `supabase/functions/send-email/index.ts`

It sends auth emails through Resend API with:

- from: `Bookimmo <noreply@book.immo>`
- branded HTML layout
- button + OTP code
- per-action subjects for:
  - `signup`
  - `recovery`
  - `magiclink`
  - `invite`
  - `email_change`

## 1. Verify the sending domain in Resend

In Resend:

- add domain `book.immo`
- verify DNS records
- confirm that `noreply@book.immo` is allowed as a sender

## 2. Add Supabase function secrets

Set these secrets in Supabase:

- `RESEND_API_KEY`
- `SEND_EMAIL_HOOK_SECRET`
- `SUPABASE_URL`
- `BOOKIMMO_APP_URL`
- optional: `BOOKIMMO_FROM_EMAIL`

Suggested values:

- `BOOKIMMO_APP_URL=https://book.immo`
- `BOOKIMMO_FROM_EMAIL=Bookimmo <noreply@book.immo>`

## 3. Deploy the function

```bash
supabase functions deploy send-email --no-verify-jwt
```

## 4. Connect it in Supabase

In Supabase dashboard:

1. `Authentication`
2. `Hooks`
3. `Send Email`
4. enable hook
5. point it to deployed function URL
6. generate/copy hook secret and store it as `SEND_EMAIL_HOOK_SECRET`

Important:

- when `Send Email Hook` is enabled, Supabase uses the hook instead of SMTP for auth emails
- this is the right path when you want full control over branding and sender identity

## 5. Keep URL config correct

Still set:

- `Site URL` to your production app URL
- allowed `Redirect URLs` for prod and localhost

Example:

- `https://book.immo/**`
- `http://localhost:3000/**`

## Alternative

If you do not need custom HTML or logic, you can also use Resend SMTP directly in Supabase:

- host: `smtp.resend.com`
- port: `465`
- username: `resend`
- password: your Resend API key

But for Bookimmo, the hook approach is better because it allows custom UX and future localization.
