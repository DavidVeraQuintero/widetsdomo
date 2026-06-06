import { useRef } from 'react';
import styles from './primitives.module.css';

export default function ColorWheel({ color, onChange, size = 60 }) {
  const inputRef = useRef(null);
  const centerSize = Math.round(size * 0.38);

  return (
    <div
      className={styles.colorWheelWrap}
      style={{ width: size, height: size }}
      onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className={styles.colorWheel} style={{ width: size, height: size }} />
      <div
        className={styles.colorCenter}
        style={{ width: centerSize, height: centerSize, background: color }}
      />
      <input
        ref={inputRef}
        type="color"
        value={color}
        className={styles.hiddenColorInput}
        onChange={e => onChange(e.target.value)}
        onMouseDown={e => e.stopPropagation()}
      />
    </div>
  );
}
