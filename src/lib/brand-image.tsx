/** Shared JSX for generated PNGs (PWA icons). Rendered by next/og. */
export function CupIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#14100E",
      }}
    >
      <svg width={size * 0.66} height={size * 0.66} viewBox="0 0 32 32">
        <path
          d="M12 4 q-2 2.5 0 5 M16.5 3.5 q-2 3 0 6"
          stroke="#E8A35C"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M6 12 h17 v6 a7 7 0 0 1 -7 7 h-3 a7 7 0 0 1 -7 -7 z" fill="#E8A35C" />
        <path d="M23 14 h1.3 a3 3 0 0 1 0 6 H22.5" stroke="#E8A35C" strokeWidth="2.2" fill="none" />
      </svg>
    </div>
  );
}
