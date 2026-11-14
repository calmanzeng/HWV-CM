import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { WorkspaceProvider } from './useWorkspace';
import './styles/app.css';
import './styles/pages.css';
import './styles/shell.css';
import './styles/screens.css';


createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </React.StrictMode>,
);
