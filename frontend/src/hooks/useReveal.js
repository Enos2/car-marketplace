/* eslint-disable react-hooks/set-state-in-effect */
// =============================================================
// FILE: frontend/src/hooks/useReveal.js
// =============================================================
// Purpose:
//   Track whether an element has entered the viewport. One-shot
//   — once revealed, stays revealed. Respects prefers-reduced-
//   motion: if the user has that enabled, reports "revealed"
//   immediately so no animation plays.
//
// Returns:
//   { ref, revealed }
//     ref       — attach to the element you want to watch
//     revealed  — boolean; true once visible (or motion is off)
// =============================================================

import { useEffect, useRef, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export default function useReveal({ threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = {}) {
  const ref = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Bail out early if the user prefers reduced motion.
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia(REDUCED_MOTION_QUERY).matches;

    if (prefersReduced) {
      setRevealed(true);
      return;
    }

    // Bail out if IntersectionObserver is not available.
    if (typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, revealed };
}

// =============================================================
// END OF FILE: frontend/src/hooks/useReveal.js
// =============================================================