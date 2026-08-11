import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import PrivacyPolicy from './PrivacyPolicy.jsx'
import Support from './Support.jsx'

const path = window.location.pathname

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {path === '/privacy' ? <PrivacyPolicy /> : path === '/support' ? <Support /> : <App />}
  </StrictMode>,
)
