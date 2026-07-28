import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';

import { getFirebaseDb } from './firebase/config';
import { collection, getDocs } from 'firebase/firestore';

setTimeout(async () => {
  try {
    const db = getFirebaseDb();
    const snap = await getDocs(collection(db, 'stores'));
    const stores: any[] = [];
    snap.forEach(d => {
      stores.push({ id: d.id, ...d.data() });
    });
    
    await fetch('/api/debug-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stores })
    });
  } catch (err: any) {
    await fetch('/api/debug-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message })
    });
  }
}, 3000);

import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
