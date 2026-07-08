import { useState, useEffect } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import styles from './Login.module.css';

export default function Login({ onAuth }) {
  const [googleClientId, setGoogleClientId] = useState('');
  const [houseName, setHouseName] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/google-client-id')
      .then(r => r.json())
      .then(d => {
        setGoogleClientId(d.clientId ?? '');
        setHouseName(d.houseName ?? '');
      })
      .catch(() => {});
  }, []);

  const handleGoogleSuccess = async ({ credential }) => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (res.ok) {
        onAuth();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'No autorizado');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });
      if (res.ok) {
        onAuth();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const form = (
    <div className={styles.card}>
      <div className={styles.logo}>🏠</div>
      <div className={styles.title}>{houseName || 'Mi Hogar'}</div>

      {googleClientId && (
        <>
          <div className={styles.googleBtn} style={showAdminForm ? { marginBottom: 8 } : undefined}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Error al iniciar con Google')}
              width="256"
              theme="filled_black"
            />
          </div>
          {!showAdminForm && (
            <div className={styles.divider}><span>o</span></div>
          )}
        </>
      )}

      {!showAdminForm && (
        <button
          type="button"
          className={styles.adminToggle}
          onClick={() => setShowAdminForm(true)}
        >
          Acceso admin
        </button>
      )}

      {showAdminForm && (
        <form className={styles.adminSection} onSubmit={handleAdminSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Usuario</label>
            <input
              className={styles.input}
              type="text"
              value={user}
              onChange={e => setUser(e.target.value)}
              placeholder="admin"
              autoComplete="username"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Contraseña</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button
            className={styles.btn}
            type="submit"
            disabled={loading || !user || !password}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
          <button
            type="button"
            className={styles.adminToggle}
            onClick={() => { setShowAdminForm(false); setError(''); }}
          >
            Cancelar
          </button>
        </form>
      )}

      <div className={styles.error}>{error}</div>
    </div>
  );

  return (
    <div className={styles.page}>
      {googleClientId
        ? <GoogleOAuthProvider clientId={googleClientId}>{form}</GoogleOAuthProvider>
        : form
      }
    </div>
  );
}
