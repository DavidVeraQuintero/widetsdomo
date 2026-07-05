import SvgIcon from './SvgIcon';

// Tamaños estandarizados por tipo de widget
// Cambiar aquí aplica a TODOS los widgets del mismo tamaño

export const WIDGET_SIZES = {
  // 1x1: Solo ícono + nombre
  SIZE_1X1: {
    iconSize: 44,
    nameClass: 'w-name',
    containerClass: 'w-body',
    containerStyle: { justifyContent: 'space-between', alignItems: 'center', gap: '0.28rem' }
  },

  // 1x2: Ícono grande + nombre + info
  SIZE_1X2: {
    iconSize: 56,
    nameClass: 'w-name',
    containerClass: 'w-body',
    containerStyle: {},
    infoClass: 'w-status'
  },

  // 2x1: Ícono + nombre + control (horizontal)
  SIZE_2X1: {
    iconSize: 36,
    nameClass: 'w-name',
    containerClass: 'w-row-body',
    containerStyle: {},
    infoClass: 'w-status'
  },

  // 2x2: Ícono + múltiples datos
  SIZE_2X2: {
    iconSize: 52,
    nameClass: 'w-name',
    containerClass: 'w-body',
    containerStyle: {},
    infoClass: 'w-status'
  }
};

// Componente: Ícono estandarizado por tamaño
export function StandardIcon({ id, size, color, className = '', glow = false, style = {} }) {
  return (
    <SvgIcon
      id={id}
      size={WIDGET_SIZES[size]?.iconSize || 44}
      color={color}
      className={`${glow ? 'icon-glow' : ''} ${className}`.trim()}
      style={style}
    />
  );
}

// Componente: Contenedor 1x1 (mínimo)
export function Widget1x1({ name, icon, iconColor, onIconClick, longPress, modal }) {
  return (
    <div className={WIDGET_SIZES.SIZE_1X1.containerClass} style={WIDGET_SIZES.SIZE_1X1.containerStyle}>
      <div className={WIDGET_SIZES.SIZE_1X1.nameClass} style={{ width: '100%', textAlign: 'center', lineHeight: 1.1, wordBreak: 'break-word' }}>
        {name}
      </div>
      <span style={{ cursor: 'pointer', userSelect: 'none' }} onClick={onIconClick} {...longPress}>
        <StandardIcon id={icon} size="SIZE_1X1" color={iconColor} glow={true} />
      </span>
      {modal}
    </div>
  );
}

// Componente: Contenedor 1x2 (vertical, ícono grande)
export function Widget1x2({ name, icon, iconColor, status, controls, longPress, modal }) {
  return (
    <div className={WIDGET_SIZES.SIZE_1X2.containerClass}>
      {controls && <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{controls}</div>}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ cursor: 'pointer' }} {...longPress}>
          <StandardIcon id={icon} size="SIZE_1X2" color={iconColor} glow={true} />
        </span>
      </div>
      <div className="w-name-lg" style={{ textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </div>
      {status && <div className="w-status-lg">{status}</div>}
      {modal}
    </div>
  );
}

// Componente: Contenedor 2x1 (horizontal)
export function Widget2x1({ name, icon, iconColor, status, controls, content, longPress, modal }) {
  return (
    <div className={WIDGET_SIZES.SIZE_2X1.containerClass}>
      <span style={{ flexShrink: 0, cursor: 'pointer', alignSelf: 'flex-start', marginTop: '0.28rem' }} {...longPress}>
        <StandardIcon id={icon} size="SIZE_2X1" color={iconColor} glow={true} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={WIDGET_SIZES.SIZE_2X1.nameClass}>{name}</div>
        {status && <div className={WIDGET_SIZES.SIZE_2X1.infoClass}>{status}</div>}
        {content}
      </div>
      {controls}
      {modal}
    </div>
  );
}

// Componente: Contenedor 2x2 (máximo)
export function Widget2x2({ name, icon, iconColor, controls, content, longPress, modal }) {
  return (
    <div className={WIDGET_SIZES.SIZE_2X2.containerClass}>
      <div className="w-row">
        <div></div>
        {controls && <div>{controls}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ cursor: 'pointer' }} {...longPress}>
          <StandardIcon id={icon} size="SIZE_2X2" color={iconColor} glow={true} />
        </span>
        <div className="w-name-lg">{name}</div>
      </div>
      {content}
      {modal}
    </div>
  );
}
