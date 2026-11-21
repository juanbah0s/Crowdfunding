import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { applyPreferences, readStoredPreferences } from './lib/preferences'
import './index.css'

// HU-22 / HU-23: aplicar tema y tamaño antes del primer render evita un destello con el tema equivocado.
applyPreferences(readStoredPreferences())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
