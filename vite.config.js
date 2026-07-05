import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const PRIVATE_IP_RE = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|127\.\d+\.\d+\.\d+|::1|localhost)$/;

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'hub-proxy',
      configureServer(server) {
        server.middlewares.use('/api/hub-proxy', (req, res, next) => {
          if (req.method !== 'POST') { next(); return; }
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const parsed = JSON.parse(body);
              const { type, token, path, method = 'GET' } = parsed;
              const ip = (parsed.ip || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
              if (!type || !ip || !path) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Missing required fields' }));
                return;
              }
              if (!PRIVATE_IP_RE.test(ip.split(':')[0])) {
                res.statusCode = 403;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Only private/LAN IPs allowed' }));
                return;
              }
              const url = `http://${ip}${path}`;
              const headers = type === 'homeassistant' ? { Authorization: `Bearer ${token}` } : {};
              const ctrl = new AbortController();
              const timer = setTimeout(() => ctrl.abort(), 8000);
              try {
                const upstream = await fetch(url, { method, headers, signal: ctrl.signal });
                clearTimeout(timer);
                const data = await upstream.json();
                res.statusCode = upstream.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              } catch (err) {
                clearTimeout(timer);
                res.statusCode = 502;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err?.message || 'Request failed' }));
              }
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid JSON body' }));
            }
          });
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
    },
  },
})
