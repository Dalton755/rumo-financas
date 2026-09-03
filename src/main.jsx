import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './styles/theme.css'
import './styles/cardpadrao.css'

import App from './App.jsx'
import { ToastProvider } from './context/ToastContext'
import { DashboardProvider } from './context/DashboardContext'
import { PlanoProvider } from './context/PlanoContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>

      <PlanoProvider>

        <DashboardProvider>
          <App />
        </DashboardProvider>

      </PlanoProvider>

    </ToastProvider>
  </StrictMode>,
)
