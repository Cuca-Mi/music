import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

declare global {
  interface Window {
    __ONDATUBE_MOUNTED__?: boolean;
  }
}

window.__ONDATUBE_MOUNTED__ = true;
createRoot(document.getElementById('root')!).render(<App />);

