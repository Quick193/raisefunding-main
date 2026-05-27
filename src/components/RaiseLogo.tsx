interface RaiseLogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
  textSize?: string;
}

export const RaiseLogo = ({
  className = '',
  iconSize = 32,
  showText = true,
  textSize = 'text-2xl',
}: RaiseLogoProps) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Organic splat icon — matches the brand logo */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M50,5 C70,5 90,20 92,38 C94,56 82,62 88,75 C94,88 80,98 65,95 C50,92 44,82 30,88 C16,94 5,82 8,65 C11,48 24,42 20,28 C16,14 30,5 50,5Z"
          fill="#ea580c"
        />
      </svg>

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
