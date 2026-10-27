import { useEffect, useState } from 'react';

interface Props {
  text: string;
  speed?: number;      // ms per character
  startDelay?: number; // ms before typing begins
  className?: string;
}

// Types out a single string character by character with a blinking cursor.
// Lighter than TypingHeroTitle, meant for short labels like "Coming soon".
export const TypingText = ({ text, speed = 95, startDelay = 350, className = '' }: Props) => {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!started || count >= text.length) return;
    const t = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(t);
  }, [started, count, text.length, speed]);

  return (
    <span className={className}>
      {text.slice(0, count)}
      <span className="animate-pulse" style={{ marginLeft: '2px' }}>|</span>
    </span>
  );
};
