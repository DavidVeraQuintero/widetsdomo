import { useState, useEffect } from 'react';
import styles from './HomePicker.module.css';

export default function HomePicker({ onEnterHome, onLogout }) {
  const [homes, setHomes]           = useState(null); // null = loading
  const [entering, setEntering]     = useState(null); // homeId being entered
  const [error, setError]           = useState('');

  useEffect(() => {
    fetch('/api/session/my-homes')
      .then(r => r.json())
      .then(async data => {
        if (data.length === 1) {
          setEntering(data[0].id);
          await enterHome(data[0]);
        } else {
          setHomes(data);
        }
      })
      .catch(() => {
        setError('Error al cargar tus casas');
        setHomes([]);
      });
  }, []);

  const enterHome = async (home) => {
    setEntering(home.id);
    setError('');
    try {
      const res = await fetch('/api/session/enter-home', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeId: home.id }),
      });
      if (!res.ok) throw new Error();
      onEnterHome(home.id, home.name);
    } catch {
      setError('Error al entrar a la casa');
      setEntering(null);
    }
  };

  if (homes === null) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.loading}>Cargando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Selecciona tu casa</h1>

        {error && <div className={styles.errorMsg}>{error}</div>}

        {homes.length === 0 ? (
          <p className={styles.noAccess}>
            No tienes acceso a ninguna casa. Contacta al administrador.
          </p>
        ) : (
          <div className={styles.grid}>
            {homes.map(home => (
              <button
                key={home.id}
                className={styles.homeCard}
                onClick={() => enterHome(home)}
                disabled={entering !== null}
              >
                <span className={styles.homeIcon}>🏠</span>
                <span className={styles.homeName}>{home.name}</span>
                {entering === home.id && <span className={styles.spinner}>...</span>}
              </button>
            ))}
          </div>
        )}

        <button className={styles.logoutBtn} onClick={onLogout}>
          ⏻ Cerrar sesión
        </button>
      </div>
    </div>
  );
}
