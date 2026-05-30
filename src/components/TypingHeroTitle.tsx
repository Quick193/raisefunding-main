import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const LINES = [
  { text: 'Empowering Dreams', orange: true },
  { text: 'with Community', orange: false },
  { text: 'Crowdfunding', orange: true },
];

const TYPING_SPEED = 55; // ms per character
const LINE_PAUSE   = 140; // ms pause between lines

const ORANGE_CLASS =
  'text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500';

interface Props {
  className?: string;
  onComplete?: () => void;
}

export const TypingHeroTitle = ({ className = '', onComplete }: Props) => {
  const [lineIndex, setLineIndex]   = useState(0);
  const [charIndex, setCharIndex]   = useState(0);
  const cursorRef = useRef<HTMLSpanElement>(null);
  const isDone = lineIndex >= LINES.length;

  // Re-start GSAP blink whenever the cursor mounts on a new element
  useEffect(() => {
    if (!cursorRef.current) return;
    gsap.killTweensOf(cursorRef.current);
    gsap.set(cursorRef.current, { opacity: 1 });
    gsap.to(cursorRef.current, {
      opacity: 0,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    });
  }, [lineIndex, isDone]);

  // Fire onComplete once typing finishes
  useEffect(() => {
    if (isDone && onComplete) onComplete();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  // Typing clock
  useEffect(() => {
    if (isDone) return;
    const currentLine = LINES[lineIndex];

    if (charIndex < currentLine.text.length) {
      const t = setTimeout(() => setCharIndex(i => i + 1), TYPING_SPEED);
      return () => clearTimeout(t);
    } else {
      // Line finished — pause then advance
      const t = setTimeout(() => {
        setLineIndex(i => i + 1);
        setCharIndex(0);
      }, LINE_PAUSE);
      return () => clearTimeout(t);
    }
  }, [lineIndex, charIndex, isDone]);

  return (
    <h1 className={className}>
      {LINES.map((line, i) => {
        // Don't render lines we haven't started yet
        if (i > lineIndex && !isDone) return null;

        const isCurrentLine = i === lineIndex && !isDone;
        const visible = isCurrentLine
          ? line.text.slice(0, charIndex)
          : line.text;

        const isLastLine = i === LINES.length - 1;

        return (
          <span key={i} className="block">
            <span className={line.orange ? ORANGE_CLASS : ''}>
              {visible}
            </span>
            {/* Cursor: inline while typing this line, or inline after last line when done */}
            {(isCurrentLine || (isDone && isLastLine)) && (
              <span
                ref={cursorRef}
                className="text-orange-500"
                style={{ marginLeft: '2px' }}
              >
                |
              </span>
            )}
          </span>
        );
      })}
    </h1>
  );
};
