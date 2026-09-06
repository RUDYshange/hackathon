import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
// `base` differs by command:
//   - build  -> '/static/'  so the production bundle's asset URLs resolve under
//     Django's STATIC_URL when the SPA is served by Django (combined app).
//   - serve  -> '/'         so the standalone Vite dev server (make run) is
//     reachable at http://localhost:5173/ as before.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/static/' : '/',
  plugins: [react()],
  build: {
    // Transpile down to ES2019 so the bundle parses on older device browsers
    // (older iOS Safari, in-app webviews, older Android WebView). Without this,
    // Vite ships modern syntax such as private class fields (#field), which
    // fails to parse on those browsers and renders a blank page.
    target: 'es2019',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
}));
