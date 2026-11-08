import express from 'express'

import agentApplicationThreadHandler from '../api/agent/application-thread.js'
import agentApplicationsHandler from '../api/agent/applications.js'
import agentMeHandler from '../api/agent/me.js'
import applicationsLinkThreadHandler from '../api/applications-link-thread.js'
import applicationsSyncHandler from '../api/applications-sync.js'
import applicationsThreadHandler from '../api/applications-thread.js'
import applicationsHandler from '../api/applications.js'
import favoritesHandler from '../api/favorites.js'
import formsSubmitHandler from '../api/forms/submit.js'
import listingLookupHandler from '../api/listings/by-ids.js'
import is24SearchHandler from '../api/is24/search.js'
import latestListingsHandler from '../api/listings/latest.js'
import mapListingsHandler from '../api/listings/map.js'
import searchListingsHandler from '../api/listings/search.js'
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
app.all('/api/applications-thread', wrap(applicationsThreadHandler))
app.all('/api/applications-link-thread', wrap(applicationsLinkThreadHandler))
app.all('/api/applications-sync', wrap(applicationsSyncHandler))
app.all('/api/agent/me', wrap(agentMeHandler))
app.all('/api/agent/applications', wrap(agentApplicationsHandler))
app.all('/api/agent/application-thread', wrap(agentApplicationThreadHandler))
app.all('/api/forms/submit', wrap(formsSubmitHandler))
app.all('/api/listings/latest', wrap(latestListingsHandler))
app.all('/api/is24/search', wrap(is24SearchHandler))
app.all('/api/listings/map', wrap(mapListingsHandler))
app.all('/api/listings/search', wrap(searchListingsHandler))
app.all('/api/listings/by-ids', wrap(listingLookupHandler))

app.listen(port, '127.0.0.1', () => {
  console.log(`Bookimmo Oracle bridge listening on 127.0.0.1:${port}`)
})
