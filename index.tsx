import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

console.log('BugHunt: Starting initialization...');
console.log('BugHunt: Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'using fallback');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('BugHunt: Root element not found!');
  throw new Error("Could not find root element to mount to");
}

console.log('BugHunt: Root element found, creating React root...');

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('BugHunt: React root created, rendering app...');
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('BugHunt: App rendered successfully');
} catch (error) {
  console.error('BugHunt: Failed to render app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h1>Fatal Error</h1>
      <p>${error instanceof Error ? error.message : String(error)}</p>
      <pre>${error instanceof Error ? error.stack : ''}</pre>
    </div>
  `;
}