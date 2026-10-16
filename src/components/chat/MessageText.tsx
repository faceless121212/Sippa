import { Fragment } from "react";

/** Renders chat text; *actions* in asterisks become italics (dimmed unless `dim={false}`). */
export function MessageText({ text, dim = true }: { text: string; dim?: boolean }) {
  const parts = text.split(/(\*[^*\n]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\*[^*\n]+\*$/.test(p) ? (
          <em key={i} className={dim ? "opacity-70" : undefined}>
            {p.slice(1, -1)}
          </em>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}
