import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './components/AuthContext';
import { CompletionModalProvider } from './components/CompletionModalContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CompletionModalProvider>
        <App />
      </CompletionModalProvider>
    </AuthProvider>
  </React.StrictMode>
);
