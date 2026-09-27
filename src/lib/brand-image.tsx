/** Shared JSX for generated PNGs (PWA / Apple icons). Rendered by next/og. Matches src/app/icon.svg. */
const PETALS = [0, 72, 144, 216, 288];

/** The Sippa flower: lime petals on black. `scale` shrinks the flower for maskable safe zones. */
export function FlowerIcon({ size, scale = 1 }: { size: number; scale?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
      }}
    >
      <svg width={size * scale} height={size * scale} viewBox="0 0 32 32">
        <g fill="#C3FF00">
          {PETALS.map((deg) => (
            <ellipse key={deg} cx="16" cy="9.4" rx="4.3" ry="5.9" transform={`rotate(${deg} 16 16)`} />
          ))}
        </g>
        <circle cx="16" cy="16" r="3.4" fill="#000000" />
        <circle cx="16" cy="16" r="1.6" fill="#C3FF00" />
      </svg>
    </div>
  );
}
