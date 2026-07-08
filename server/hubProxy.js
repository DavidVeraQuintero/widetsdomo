import { Router } from 'express';

const PRIVATE_IP_RE = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|127\.\d+\.\d+\.\d+|::1|localhost)$/;
const ALLOWED_CLOUD_HOSTS = new Set(['cloud.hubitat.com']);

const router = Router();

router.post('/hub-proxy', async (req, res) => {
  const { type, token, path, method = 'GET' } = req.body ?? {};
  let rawIp = (req.body?.ip || '').replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();
  const host = rawIp.split(':')[0];

  if (!type || !rawIp || !path) return res.status(400).json({ error: 'Missing required fields' });

  const isPrivate = PRIVATE_IP_RE.test(host);
  const isAllowedCloud = ALLOWED_CLOUD_HOSTS.has(host);
  if (!isPrivate && !isAllowedCloud) return res.status(403).json({ error: 'Host not allowed' });

  const scheme = isAllowedCloud ? 'https' : 'http';
  let url, headers = {};

  if (type === 'hubitat') {
    url = `${scheme}://${rawIp}${path}`;
  } else if (type === 'homeassistant') {
    url = `${scheme}://${rawIp}${path}`;
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    return res.status(400).json({ error: 'Unknown hub type' });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const fetchOpts = { method, headers, signal: ctrl.signal };
    if (req.body?.body) {
      fetchOpts.body = req.body.body;
      fetchOpts.headers = { ...headers, 'Content-Type': 'application/json' };
    }
    const upstream = await fetch(url, fetchOpts);
    clearTimeout(timer);
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    clearTimeout(timer);
    res.status(502).json({ error: err?.message || 'Request failed' });
  }
});

export default router;
