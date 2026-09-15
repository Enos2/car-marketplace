// =============================================================
// FILE: frontend/src/components/Pagination.jsx
// =============================================================

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  const goto = (p) => {
    if (p < 1 || p > pages || p === page) return;
    onChange(p);
  };

  return (
    <nav className="mt-10 flex items-center justify-between border-t border-neutral-800 pt-6">
      <button
        type="button"
        onClick={() => goto(page - 1)}
        disabled={page <= 1}
        className="text-sm text-neutral-400 hover:text-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        ← Previous
      </button>

      <span className="text-sm text-neutral-500">
        Page {page} of {pages}
      </span>

      <button
        type="button"
        onClick={() => goto(page + 1)}
        disabled={page >= pages}
        className="text-sm text-neutral-400 hover:text-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next →
      </button>
    </nav>
  );
}

// =============================================================
// END OF FILE: frontend/src/components/Pagination.jsx
// =============================================================