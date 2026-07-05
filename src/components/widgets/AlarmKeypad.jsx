import React from 'react';
import { WIDGET_SIZES } from './WidgetTemplates';

export default function AlarmKeypad({
  onDigit,
  onDelete,
  onConfirm,
  onCancel,
  inputLength = 0,
  maxLength = 6,
  disabled = false,
  error = ''
}) {
  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✔'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* PIN Dots */}
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', margin: '0.75rem 0' }}>
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '0.875rem',
              height: '0.875rem',
              borderRadius: '50%',
              border: '2px solid #64748b',
              background: i < inputLength ? '#e2e8f0' : 'transparent',
              transition: 'background 0.1s'
            }}
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="w-text-xs" style={{
          textAlign: 'center',
          color: '#ef4444',
          marginBottom: '0.5rem'
        }}>
          {error}
        </div>
      )}

      {/* Keypad Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem'
      }}>
        {keys.map(k => (
          <button
            key={k}
            className="w-btn"
            disabled={disabled}
            style={{
              padding: '0.625rem 0',
              ...(k === '✔' && { borderColor: '#22c55e', color: 'var(--text-primary)' }),
              ...(k === '⌫' && { borderColor: '#f59e0b', color: 'var(--text-primary)' }),
              ...(disabled && { opacity: 0.4, cursor: 'not-allowed' }),
            }}
            onClick={() => {
              if (k === '⌫') onDelete?.();
              else if (k === '✔') onConfirm?.();
              else if (!disabled) onDigit?.(k);
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Cancel button */}
      {onCancel && (
        <button
          className="w-btn"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={onCancel}
          onMouseDown={e => e.stopPropagation()}
        >
          Cancelar
        </button>
      )}
    </div>
  );
}
