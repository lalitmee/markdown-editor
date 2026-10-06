import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/tokens.css'
import './styles/base.css'

let savedTheme: string | null = null
try {
  savedTheme = localStorage.getItem('markdown-editor:theme')
} catch {
  // Storage can be blocked; use the system preference without preventing startup.
}
document.documentElement.dataset.theme =
  savedTheme === 'light' || savedTheme === 'dark'
    ? savedTheme
    : matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

createRoot(document.getElementById('root')!).render(<App />)
