import { useState } from 'react';
import styles from './Login.module.css';

export default function Login({ onAuth }) {
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
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

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.logo}>🏠</div>
        <div className={styles.title}>Dashboard Domótica</div>

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

        <div className={styles.error}>{error}</div>

        <button
          className={styles.btn}
          type="submit"
          disabled={loading || !user || !password}
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
