import { useState, useEffect } from 'react';
import styles from './AdminPanel.module.css';

export default function AdminPanel({ onEnterHome, onLogout }) {
  const [homes, setHomes]                 = useState([]);
  const [newName, setNewName]             = useState('');
  const [creating, setCreating]           = useState(false);
  const [membersOpenId, setMembersOpenId] = useState(null);
  const [members, setMembers]             = useState({});
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loadingEnter, setLoadingEnter]   = useState(null);
  const [error, setError]                 = useState('');

  const loadHomes = () =>
    fetch('/api/admin/homes').then(r => r.json()).then(setHomes).catch(() => {});

  useEffect(() => { loadHomes(); }, []);

  const loadMembers = async (homeId) => {
    const data = await fetch(`/api/admin/homes/${homeId}/members`).then(r => r.json()).catch(() => []);
    setMembers(prev => ({ ...prev, [homeId]: data.map(m => m.email) }));
  };

  const toggleMembers = (homeId) => {
    if (membersOpenId === homeId) {
      setMembersOpenId(null);
    } else {
      setMembersOpenId(homeId);
      setNewMemberEmail('');
      loadMembers(homeId);
    }
  };

  const createHome = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/homes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error();
      setNewName('');
      loadHomes();
    } catch {
      setError('Error al crear la casa');
    } finally {
      setCreating(false);
    }
  };

  const deleteHome = async (id) => {
    if (!window.confirm('¿Eliminar esta casa? Se borrarán todos sus datos.')) return;
    await fetch(`/api/admin/homes/${id}`, { method: 'DELETE' });
    if (membersOpenId === id) setMembersOpenId(null);
    loadHomes();
  };

  const enterHome = async (home) => {
    setLoadingEnter(home.id);
    setError('');
    try {
      const res = await fetch(`/api/admin/homes/${home.id}/enter`, { method: 'POST' });
      if (!res.ok) throw new Error();
      onEnterHome(home.id, home.name);
    } catch {
      setError('Error al entrar a la casa');
    } finally {
      setLoadingEnter(null);
    }
  };

  const addMember = async (homeId) => {
    const email = newMemberEmail.trim().toLowerCase();
    if (!email) return;
    await fetch(`/api/admin/homes/${homeId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setNewMemberEmail('');
    loadMembers(homeId);
  };

  const removeMember = async (homeId, email) => {
    await fetch(`/api/admin/homes/${homeId}/members/${encodeURIComponent(email)}`, { method: 'DELETE' });
    loadMembers(homeId);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Panel de Administración</h1>
          <button className={styles.logoutBtn} onClick={onLogout}>⏻ Cerrar sesión</button>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <div className={styles.createRow}>
          <input
            className={styles.input}
            type="text"
            placeholder="Nombre de la nueva casa"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createHome()}
          />
          <button className={styles.createBtn} onClick={createHome} disabled={creating || !newName.trim()}>
            {creating ? '...' : 'Crear'}
          </button>
        </div>

        <div className={styles.homeList}>
          {homes.length === 0 && (
            <div className={styles.emptyHint}>Sin casas creadas</div>
          )}
          {homes.map(home => (
            <div key={home.id} className={styles.homeCard}>
              <div className={styles.homeRow}>
                <span className={styles.homeName}>{home.name}</span>
                <div className={styles.homeActions}>
                  <button
                    className={styles.enterBtn}
                    onClick={() => enterHome(home)}
                    disabled={loadingEnter === home.id}
                  >
                    {loadingEnter === home.id ? '...' : 'Entrar'}
                  </button>
                  <button
                    className={`${styles.membersBtn} ${membersOpenId === home.id ? styles.membersBtnActive : ''}`}
                    onClick={() => toggleMembers(home.id)}
                  >
                    Miembros
                  </button>
                  <button className={styles.deleteBtn} onClick={() => deleteHome(home.id)}>
                    Eliminar
                  </button>
                </div>
              </div>

              {membersOpenId === home.id && (
                <div className={styles.membersPanel}>
                  <div className={styles.memberList}>
                    {(!members[home.id] || members[home.id].length === 0) ? (
                      <div className={styles.emptyHint}>Sin miembros</div>
                    ) : (
                      members[home.id].map(email => (
                        <div key={email} className={styles.memberRow}>
                          <span className={styles.memberEmail}>{email}</span>
                          <button className={styles.removeBtn} onClick={() => removeMember(home.id, email)}>×</button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className={styles.addMemberRow}>
                    <input
                      className={styles.input}
                      type="email"
                      placeholder="correo@gmail.com"
                      value={newMemberEmail}
                      onChange={e => setNewMemberEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addMember(home.id)}
                    />
                    <button
                      className={styles.addBtn}
                      onClick={() => addMember(home.id)}
                      disabled={!newMemberEmail.trim()}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
