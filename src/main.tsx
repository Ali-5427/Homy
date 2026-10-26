import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against third-party browser extensions injecting scripts that attempt to access cross-origin frames in iframes
window.addEventListener('error', (event) => {
  const msg = event.message || '';
  const file = event.filename || '';
  if (
    file.includes('chrome-extension://') ||
    msg.includes('Blocked a frame with origin') ||
    msg.includes('cross-origin frame')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason?.message || String(reason || '');
  if (
    msg.includes('Blocked a frame with origin') ||
    msg.includes('cross-origin frame') ||
    msg.includes('chrome-extension://')
  ) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(<App />);
