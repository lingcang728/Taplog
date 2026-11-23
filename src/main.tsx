import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/layout.css'
import './styles/components.css'
import { App } from './App'

// Unregister any legacy offline shell worker from pre-v1 builds so fresh lecture assets always load cleanly.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) {
      void reg.unregister()
    }
  }).catch(() => {})
}

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Missing #root container')
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
