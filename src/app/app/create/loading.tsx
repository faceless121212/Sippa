/**
 * Shown instantly when you open any app section, while its data loads.
 * The sidebar (layout) stays in place; only the content area shows placeholders.
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 md:py-8" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading…</p>
      <div className="bg-surface-2 h-9 w-48 animate-pulse rounded-lg" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-surface-2 h-40 animate-pulse rounded-xl" />
        <div className="bg-surface-2 h-40 animate-pulse rounded-xl" />
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="bg-surface-2 aspect-[3/4] animate-pulse rounded-xl" />
        ))}
      </ul>
    </div>
  );
}
