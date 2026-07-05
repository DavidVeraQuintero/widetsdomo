import { createPortal } from 'react-dom';

export default function ConfirmModal({ title, message, onConfirm, onCancel, isDangerous = false }) {
  const stop = e => e.stopPropagation();

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.75)',
      }}
      onMouseDown={e => {
        if (e.target === e.currentTarget) {
          stop(e);
          onCancel();
        }
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg,#0f172a,#0a1f3d)',
          border: '2px solid #1e3a5f',
          borderRadius: 16,
          padding: 20,
          width: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 0 40px rgba(0,0,0,0.7)',
        }}
        onMouseDown={stop}
        onClick={stop}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13 }}>
            {title}
          </span>
          <button
            className="w-btn"
            style={{ padding: '2px 8px', fontSize: 11 }}
            onMouseDown={stop}
            onClick={onCancel}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            className="w-btn w-btn-sm"
            onMouseDown={stop}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="w-btn w-btn-sm"
            onMouseDown={stop}
            onClick={onConfirm}
            style={
              isDangerous
                ? {
                    background: '#dc2626',
                    borderColor: '#ef4444',
                    color: '#fca5a5',
                    cursor: 'pointer',
                  }
                : {
                    background: '#1d4ed8',
                    borderColor: '#3b82f6',
                    color: '#93c5fd',
                    cursor: 'pointer',
                  }
            }
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
