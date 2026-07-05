import express from 'express'

import applicationsHandler from '../api/applications.js'
import favoritesHandler from '../api/favorites.js'
import profileHandler from '../api/profile.js'
import savedSearchesHandler from '../api/saved-searches.js'
import forgotPasswordHandler from '../api/auth/forgot-password.js'
import loginHandler from '../api/auth/login.js'
import logoutHandler from '../api/auth/logout.js'
import meHandler from '../api/auth/me.js'
import registerHandler from '../api/auth/register.js'
import resetPasswordHandler from '../api/auth/reset-password.js'
import verifyEmailHandler from '../api/auth/verify-email.js'

const app = express()
const port = Number(process.env.BOOKIMMO_BRIDGE_PORT || 8789)

app.set('trust proxy', true)
app.use(express.json({ limit: '2mb' }))

app.use((req, _res, next) => {
  req.body = req.body ?? {}
  next()
})

function wrap(handler) {
  return async (req, res) => {
    try {
      await handler(req, res)
    } catch (error) {
      console.error('bridge_handler_failed', req.method, req.originalUrl, error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Bridge request failed.' })
      } else {
        res.end()
      }
    }
  }
}

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true })
})

app.all('/api/auth/register', wrap(registerHandler))
app.all('/api/auth/login', wrap(loginHandler))
app.all('/api/auth/logout', wrap(logoutHandler))
app.all('/api/auth/me', wrap(meHandler))
app.all('/api/auth/verify-email', wrap(verifyEmailHandler))
app.all('/api/auth/forgot-password', wrap(forgotPasswordHandler))
app.all('/api/auth/reset-password', wrap(resetPasswordHandler))

app.all('/api/profile', wrap(profileHandler))
app.all('/api/favorites', wrap(favoritesHandler))
app.all('/api/saved-searches', wrap(savedSearchesHandler))
app.all('/api/applications', wrap(applicationsHandler))

app.listen(port, '127.0.0.1', () => {
  console.log(`Bookimmo Oracle bridge listening on 127.0.0.1:${port}`)
})
