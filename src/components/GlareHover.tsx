import './GlareHover.css';

interface GlareHoverProps {
  children: React.ReactNode;
  glareColor?: string;
  glareOpacity?: number;
  /** Duration of the sweep in ms (default 1400) */
  transitionDuration?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Wraps any content and sweeps a glare stripe across it on hover.
 * Uses transform:translateX (GPU-accelerated) for a smooth, deliberate sweep.
 * Adds overflow:hidden + position:relative — pair with border-radius via className.
 */
const GlareHover = ({
  children,
  glareColor = '#ffffff',
  glareOpacity = 0.22,
  transitionDuration = 1400,
  className = '',
  style = {},
  onClick,
}: GlareHoverProps) => {
  // Convert hex to rgba
  const hex = glareColor.replace('#', '');
  let rgba = glareColor;
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  } else if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    rgba = `rgba(${r}, ${g}, ${b}, ${glareOpacity})`;
  }

  const cssVars = {
    '--gh-duration': `${transitionDuration}ms`,
    '--gh-rgba': rgba,
  } as React.CSSProperties;

  return (
    <div
      className={`glare-hover ${className}`}
      style={{ ...cssVars, ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlareHover;
