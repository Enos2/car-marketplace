// =============================================================
// FILE: frontend/src/components/Reveal.jsx
// =============================================================
// Purpose:
//   Wrap any block to fade + slide it in as it enters the
//   viewport. Uses useReveal. Supports a per-instance delay so
//   a grid can cascade.
//
// Props:
//   as        — element type (default 'div')
//   delay     — ms before animation starts once revealed
//   className — passthrough
// =============================================================

import useReveal from '../hooks/useReveal';

export default function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
  ...rest
}) {
  const { ref, revealed } = useReveal();

  return (
    <Tag
      ref={ref}
      className={`reveal ${revealed ? 'reveal-in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// =============================================================
// END OF FILE: frontend/src/components/Reveal.jsx
// =============================================================