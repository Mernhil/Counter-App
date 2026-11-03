import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyTheme, loadTheme } from './hooks'
import './styles.css'

applyTheme(loadTheme())
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(loadTheme()))

// Ask the browser not to evict our data under storage pressure.
navigator.storage?.persist?.().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
