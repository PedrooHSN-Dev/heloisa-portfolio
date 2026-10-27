import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { DataProvider } from './data.jsx'
import { LangProvider } from './i18n.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DataProvider>
      <LangProvider>
        <App />
      </LangProvider>
    </DataProvider>
  </StrictMode>,
)
