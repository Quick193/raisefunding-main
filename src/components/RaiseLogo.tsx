interface RaiseLogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
  textSize?: string;
  /** Render the PNG logo inverted to white — for dark backgrounds (footer, etc.) */
  useSvgIcon?: boolean;
}

export const RaiseLogo = ({
  className = '',
  iconSize = 32,
  showText = true,
  textSize = 'text-2xl',
  useSvgIcon = false,
}: RaiseLogoProps) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {useSvgIcon ? (
        /* Plain PNG — no blend mode, lets the orange show on dark backgrounds */
        <img
          src="/favicon.png"
          alt=""
          aria-hidden="true"
          style={{
            height: iconSize,
            width: iconSize,
            objectFit: 'contain',
          }}
        />
      ) : (
        /* Default PNG — orange logo for light backgrounds */
        <img
          src="/favicon.png"
          alt=""
          aria-hidden="true"
          style={{
            height: iconSize,
            width: iconSize,
            objectFit: 'contain',
            mixBlendMode: 'multiply',
          }}
        />
      )}

      {showText && (
        <span
          className={`${textSize} font-bold tracking-tight`}
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic', color: 'inherit' }}
        >
          raise
        </span>
      )}
    </div>
  );
};
