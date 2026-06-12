import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" toastOptions={{
        style: { background: '#2D3555', color: '#F0F4FF', border: '1px solid #3A4268' },
        success: { iconTheme: { primary: '#00D4AA', secondary: '#000' } },
      }}/>
    </BrowserRouter>
  </React.StrictMode>
)
