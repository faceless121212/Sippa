/** Shown the moment a chat is opened, while its messages load. */
export default function ChatLoading() {
  return (
    <div className="flex h-dvh" aria-busy="true" aria-live="polite">
      <div className="border-border hidden w-80 shrink-0 border-r lg:block" />
      <div className="flex flex-1 flex-col">
        <div className="border-border flex items-center gap-3 border-b px-4 py-3">
          <div className="bg-surface-2 h-10 w-10 animate-pulse rounded-full" />
          <div className="bg-surface-2 h-4 w-32 animate-pulse rounded" />
        </div>
        <div className="flex-1 space-y-3 p-4">
          <div className="bg-surface-2 h-16 w-2/3 animate-pulse rounded-2xl" />
          <div className="bg-surface-2 h-12 w-1/2 animate-pulse rounded-2xl" />
        </div>
        <p className="sr-only">Opening chat…</p>
      </div>
    </div>
  );
}
