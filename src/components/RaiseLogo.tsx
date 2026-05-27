interface RaiseLogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
  textSize?: string;
  /** Use SVG blob icon instead of PNG — best for dark backgrounds */
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
    <div className={`flex items-center gap-1.5 ${className}`}>
      {useSvgIcon ? (
        /* SVG blob — used on dark backgrounds (footer, etc.) */
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M105,18 C108,8 118,5 125,12 C132,19 128,32 122,38
               C134,28 148,26 154,35 C160,44 154,58 142,60
               C156,62 166,72 162,83 C158,94 144,96 134,90
               C140,104 138,118 128,122 C118,126 107,118 105,104
               C100,116 90,126 79,122 C68,118 66,104 72,90
               C62,96 48,94 44,83 C40,72 50,62 64,60
               C52,58 46,44 52,35 C58,26 72,28 84,38
               C78,32 74,19 81,12 C88,5 98,8 105,18Z"
            fill="#ea580c"
          />
        </svg>
      ) : (
        /* Actual PNG logo — white bg blends on light backgrounds (navbar) */
        <img
          src="/logo-icon.png"
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
