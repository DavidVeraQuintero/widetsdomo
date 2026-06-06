import styles from './primitives.module.css';

export default function Toggle({ on, onToggle }) {
  return (
    <button
      className={`${styles.toggle} ${on ? styles.toggleOn : ''}`}
      onClick={e => { e.stopPropagation(); onToggle(); }}
      onMouseDown={e => e.stopPropagation()}
      role="switch"
      aria-checked={on}
    >
      <span className={styles.toggleThumb} />
    </button>
  );
}
