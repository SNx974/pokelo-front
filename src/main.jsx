import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1D24',
            color: '#fff',
            border: '1px solid #2E3446',
            borderRadius: '10px',
          },
          success: { iconTheme: { primary: '#FFCB05', secondary: '#0D0F14' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#0D0F14' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
