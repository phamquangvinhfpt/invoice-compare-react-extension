import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../components/App';

// Tạo container và render component App
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Container element "root" not found');
}
