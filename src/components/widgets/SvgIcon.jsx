import { ICONS } from './iconLibrary';

export default function SvgIcon({ id, size = 24, color = 'currentColor', style, className }) {
  const inner = ICONS[id];
  if (!inner) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...style }}
      className={className}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
