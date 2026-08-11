import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function injectAppUrlPlugin(): Plugin {
  return {
    name: 'inject-app-url',
    transformIndexHtml(html, ctx) {
      const req = (ctx as any).req;
      let appUrl = '';
      if (req) {
        const host = req.headers.host || '';
        let protocol = req.headers['x-forwarded-proto'] || 'https';
        if (Array.isArray(protocol)) protocol = protocol[0];
        if (typeof protocol === 'string' && (host.includes('localhost') || host.includes('127.0.0.1'))) {
          protocol = 'http';
        } else {
          protocol = 'https';
        }
        appUrl = `${protocol}://${host}`;
      }
      if (appUrl) {
        const superAdminUid = process.env.VITE_SUPER_ADMIN_PI_UID || "";
        return html.replace('<head>', `<head><script>window.__APP_URL__ = "${appUrl}"; window.__SUPER_ADMIN_PI_UID__ = "${superAdminUid}";</script>`);
      }
      return html;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), injectAppUrlPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics'],
            'vendor-ui': ['lucide-react', 'motion/react', 'recharts'],
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: true,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
