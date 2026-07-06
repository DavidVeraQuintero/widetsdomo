import { useState, useEffect, useRef } from 'react';
import styles from './StatusBar.module.css';

export default function StatusBar({ mode }) {
  const [lastCmd, setLastCmd] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      setLastCmd(e.detail);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setLastCmd(null), 5000);
    };
    window.addEventListener('hub:command-sent', handler);
    return () => {
      window.removeEventListener('hub:command-sent', handler);
      clearTimeout(timerRef.current);
    };
  }, []);

  const modeLabel =
    mode === 'local'   ? 'Local · LAN directo' :
    mode === 'cloud'   ? 'Nube · Render'        :
                         'Sin conexión';

  const dotClass =
    mode === 'local'   ? styles.dotGreen :
    mode === 'cloud'   ? styles.dotAmber :
                         styles.dotRed;

  return (
    <div className={styles.bar}>
      <span className={`${styles.dot} ${dotClass}`} />
      <span className={styles.modeText}>{modeLabel}</span>

      {lastCmd && (
        <span className={`${styles.cmdTag} ${lastCmd.via === 'local' ? styles.tagLocal : styles.tagCloud}`}>
          {lastCmd.command}
          <span className={styles.sep}>·</span>
          {lastCmd.via === 'local' ? 'Local' : 'Nube'}
          <span className={styles.sep}>·</span>
          {lastCmd.ms} ms
        </span>
      )}
    </div>
  );
}
