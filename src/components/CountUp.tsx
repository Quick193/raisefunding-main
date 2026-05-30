import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';

interface CountUpProps {
  value: number;
  /** Optional formatter applied to each intermediate value during animation */
  format?: (n: number) => string;
  className?: string;
  /** Spring damping — higher = less bounce (default 60) */
  damping?: number;
  /** Spring stiffness — higher = faster (default 100) */
  stiffness?: number;
}

/**
 * Animates a number from 0 to `value` when it enters the viewport.
 * Triggers once, using a spring animation with framer-motion.
 */
export const CountUp = ({
  value,
  format,
  className,
  damping = 60,
  stiffness = 100,
}: CountUpProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref, { once: true });

  // Start counting when element enters viewport
  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, isInView, value]);

  // Subscribe to spring and update DOM text directly (avoids re-renders)
  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = format
          ? format(latest)
          : String(Math.round(latest));
      }
    });
  }, [springValue, format]);

  // Render the initial "0" (will be overwritten immediately when in view)
  return (
    <span ref={ref} className={className}>
      {format ? format(0) : '0'}
    </span>
  );
};
