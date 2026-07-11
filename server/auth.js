import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET env var is required');
const ADMIN_USER  = process.env.ADMIN_USER || 'admin';
const ADMIN_HASH  = process.env.ADMIN_PASSWORD_HASH || '';
const COOKIE_NAME = 'session';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days ms

export async function verifyCredentials(user, password) {
  if (user !== ADMIN_USER || !ADMIN_HASH) return false;
  return bcrypt.compare(password, ADMIN_HASH);
}

export function generateToken() {
  return jwt.sign({ user: ADMIN_USER }, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

export function authMiddleware(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || !verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

export function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    }).filter(([k]) => k)
  );
}

export function verifyWsRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verifyToken(cookies[COOKIE_NAME]);
}

export async function verifyGoogleCredential(credential) {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!res.ok) return null;
    const payload = await res.json();
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) return null;
    if (payload.email_verified !== 'true' && payload.email_verified !== true) return null;
    return payload.email ?? null;
  } catch {
    return null;
  }
}
