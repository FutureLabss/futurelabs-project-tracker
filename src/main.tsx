import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import { App } from './App';
import { appTheme } from './theme';
import './styles.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <MantineProvider theme={appTheme}>
        <App />
      </MantineProvider>
    </React.StrictMode>
  );
}
