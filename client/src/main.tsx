import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

// Display face carries the width axis — 125% expanded is the whole personality.
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/sora';
import '@fontsource-variable/jetbrains-mono';

import './styles/index.css';
import App from './App';
import { AudioProvider } from './lib/audio';
import { ConsentProvider } from './lib/consent';

// One extra page, one path check — a router would be more moving parts than the
// whole feature. /admin ships as its own chunk, so visitors never download it.
const Admin = lazy(() => import('./admin/Admin'));
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

// Tells the stylesheet it is allowed to hide things before revealing them.
document.documentElement.classList.add('js');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    ) : (
      <AudioProvider>
        <ConsentProvider>
          <App />
        </ConsentProvider>
      </AudioProvider>
    )}
  </StrictMode>,
);
