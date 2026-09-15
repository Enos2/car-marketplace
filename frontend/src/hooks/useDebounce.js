// =============================================================
// FILE: frontend/src/hooks/useDebounce.js
// =============================================================
// Purpose:
//   Delay a value by N milliseconds. Used for the search input.
// =============================================================

import { useEffect, useState } from 'react';

export default function useDebounce(value, delayMs = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

// =============================================================
// END OF FILE: frontend/src/hooks/useDebounce.js
// =============================================================