import {createRoot} from 'react-dom/client';
import {AuthProvider} from './context/AuthContext.tsx';
import './index.css';
import './mvp.css';

async function start(){
  // Keep the legacy demo and its audio worker out of the connected pilot build.
  const Entry=import.meta.env.VITE_SECURE_PILOT==='true'
    ? (await import('./components/PilotApp.tsx')).PilotApp
    : (await import('./App.tsx')).default;
  createRoot(document.getElementById('root')!).render(<AuthProvider><Entry/></AuthProvider>);
}
void start();
