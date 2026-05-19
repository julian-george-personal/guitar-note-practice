import { createRoot } from 'react-dom/client'
import App from './App'
import { DebugProvider } from './hooks/useDebugMode'
import DebugOverlay from './components/DebugOverlay/DebugOverlay'
import './style.css'

createRoot(document.getElementById('app')!).render(
  <DebugProvider>
    <App />
    <DebugOverlay />
  </DebugProvider>
)
