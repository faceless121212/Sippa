/** Shown instantly when you open Chats or a chat from elsewhere in the app. */
export default function ChatsLoading() {
  return (
    <div className="flex h-dvh" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading chats…</p>
      <div className="border-border w-full space-y-2 p-4 lg:w-80 lg:shrink-0 lg:border-r">
        <div className="bg-surface-2 mb-4 h-7 w-24 animate-pulse rounded" />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <div className="bg-surface-2 h-11 w-11 animate-pulse rounded-full" />
            <div className="flex-1 space-y-1.5">
              <div className="bg-surface-2 h-3.5 w-1/2 animate-pulse rounded" />
              <div className="bg-surface-2 h-3 w-3/4 animate-pulse rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
