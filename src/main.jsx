import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './i18n/config.js'
import App from './App.jsx'

const root = document.getElementById('root')
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// Use hydrateRoot when the shell was server-prerendered (avoids FOUC)
if (root.hasChildNodes()) {
  ReactDOM.hydrateRoot(root, app)
} else {
  ReactDOM.createRoot(root).render(app)
}
