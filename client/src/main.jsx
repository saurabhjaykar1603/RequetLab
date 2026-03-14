import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from 'toast-ninja'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider config={{ duration: 3000, position: 'top-right' }}>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
