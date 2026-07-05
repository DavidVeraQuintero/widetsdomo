import styles from './Canvas.module.css';

export default function CategoryHeader({ categoryName, categoryIcon, isExpanded, onToggle }) {
  return (
    <div
      style={{
        padding: '12px 16px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        userSelect: 'none',
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        transition: 'all 0.2s ease',
      }}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
    >
      <span style={{ fontSize: '18px' }}>{categoryIcon}</span>
      <span style={{ flex: 1, fontSize: '14px', fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)' }}>
        {categoryName}
      </span>
      <span
        style={{
          fontSize: '12px',
          color: 'rgba(255, 255, 255, 0.6)',
          transition: 'transform 0.2s ease',
          transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}
      >
        ▼
      </span>
    </div>
  );
}
