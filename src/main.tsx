import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Disable browser scroll restoration and force top before first paint
if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual'
  document.documentElement.style.scrollBehavior = 'auto'
  window.scrollTo(0, 0)
  document.documentElement.style.scrollBehavior = ''
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
