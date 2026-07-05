import styles from './primitives.module.css';

export default function Slider({ value, min = 0, max = 100, onChange, unit = '', showVal = true }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={styles.sliderWrap}>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        className={styles.slider}
        style={{ background: `linear-gradient(to right, rgba(255,255,255,0.75) ${pct}%, rgba(255,255,255,0.12) ${pct}%)` }}
        onChange={e => onChange(Number(e.target.value))}
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
      />
      {showVal && (
        <span className={styles.sliderVal}>{value}{unit}</span>
      )}
    </div>
  );
}
