import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nProvider } from './contexts/I18nContext';
import { WalletContextProvider } from './contexts/WalletContextProvider';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <WalletContextProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </WalletContextProvider>
);
