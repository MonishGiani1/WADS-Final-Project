import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import GamingSection from './GamingSection.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GamingSection />
  </StrictMode>,
)
