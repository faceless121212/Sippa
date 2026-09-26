import type { AvatarSpec } from "@/data/landing";

/**
 * Illustrated placeholder portrait as an SVG string. Served as a static file
 * (`/avatars/<id>.svg`) so pages stay light and images can lazy-load.
 * Deliberately stylised — Sippa never uses photos of real people.
 */
export function avatarSvg(spec: AvatarSpec): string {
  const has = (a: string) => spec.accessories?.includes(a as never) ?? false;
  const ink = "#2A1A14";
  const parts: string[] = [];
  const add = (s: string | false) => {
    if (s) parts.push(s);
  };

  add(
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${spec.bg[0]}"/><stop offset="1" stop-color="${spec.bg[1]}"/></linearGradient></defs>`,
  );
  add(`<rect width="120" height="160" fill="url(#bg)"/>`);
  add(
    `<path d="M14 30 q6 -8 0 -16 M104 46 q6 -8 0 -16" stroke="#fff" stroke-opacity="0.18" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  );

  // hair behind head
  add(
    spec.hairStyle === "long" &&
      `<path d="M30 70 Q28 34 60 34 Q92 34 90 70 L95 132 Q60 142 25 132 Z" fill="${spec.hair}"/>`,
  );

  // shoulders, neck, head
  add(`<path d="M16 160 Q18 116 60 110 Q102 116 104 160 Z" fill="${spec.outfit}"/>`);
  add(`<rect x="52" y="90" width="16" height="22" rx="6" fill="${spec.skin}"/>`);
  add(`<path d="M52 104 Q60 110 68 104 L68 100 Q60 106 52 100 Z" fill="${ink}" opacity="0.12"/>`);
  add(`<ellipse cx="60" cy="68" rx="26" ry="29" fill="${spec.skin}"/>`);
  add(
    has("beard") &&
      `<path d="M36 74 Q40 104 60 106 Q80 104 84 74 Q76 90 60 90 Q44 90 36 74 Z" fill="${spec.hair}"/>`,
  );

  // face
  add(
    `<path d="M45 70 q5 -5 10 0 M65 70 q5 -5 10 0" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  );
  add(
    `<circle cx="44" cy="79" r="4.5" fill="#E86A7E" opacity="0.28"/><circle cx="76" cy="79" r="4.5" fill="#E86A7E" opacity="0.28"/>`,
  );
  add(`<path d="M54 84 q6 5 12 0" stroke="${ink}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`);

  // hair on top
  switch (spec.hairStyle) {
    case "short":
      add(
        `<path d="M33 68 Q30 36 60 36 Q90 36 87 68 Q82 50 64 48 Q56 56 44 52 Q37 58 33 68 Z" fill="${spec.hair}"/>`,
      );
      break;
    case "long":
      add(`<path d="M33 66 Q36 40 60 38 Q84 40 87 66 Q74 48 58 52 Q44 48 33 66 Z" fill="${spec.hair}"/>`);
      break;
    case "bun":
      add(`<circle cx="60" cy="32" r="12" fill="${spec.hair}"/>`);
      add(`<path d="M33 64 Q34 40 60 39 Q86 40 87 64 Q76 48 60 48 Q44 48 33 64 Z" fill="${spec.hair}"/>`);
      break;
    case "curly": {
      const curls = [
        [35, 58],
        [38, 46],
        [47, 38],
        [60, 35],
        [73, 38],
        [82, 46],
        [85, 58],
      ];
      add(
        `<g fill="${spec.hair}">${curls.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5"/>`).join("")}</g>`,
      );
      break;
    }
    case "bald":
      break;
  }

  // accessories
  add(
    has("glasses") &&
      `<g stroke="${ink}" stroke-width="2" fill="#fff" fill-opacity="0.15"><circle cx="50" cy="70" r="8"/><circle cx="70" cy="70" r="8"/><path d="M58 70 h4" fill="none"/></g>`,
  );
  add(has("earring") && `<circle cx="34" cy="84" r="3" fill="#F2C46B"/>`);
  if (has("flower")) {
    const petals = [0, 72, 144, 216, 288]
      .map((r) => `<ellipse rx="4" ry="7" transform="rotate(${r}) translate(0 -5)" fill="#F7B6C8"/>`)
      .join("");
    add(`<g transform="translate(80 46)">${petals}<circle r="3" fill="#F2C46B"/></g>`);
  }
  if (has("laurel")) {
    const leaves = [34, 42, 50, 70, 78, 86]
      .map((x, i) => {
        const y = i < 3 ? 46 - i * 4 : 38 + (i - 3) * 4;
        return `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.6" transform="rotate(${i < 3 ? -35 : 35} ${x} ${y})"/>`;
      })
      .join("");
    add(`<g fill="#7FA35A">${leaves}</g>`);
  }
  add(
    has("crown") &&
      `<path d="M36 46 Q60 36 84 46 L82 52 Q60 44 38 52 Z" fill="#E6B84A"/><circle cx="60" cy="43" r="3.4" fill="#2E8C8C"/>`,
  );
  add(
    has("headphones") &&
      `<g fill="none" stroke="#1A1A22" stroke-width="4"><path d="M32 66 Q32 32 60 32 Q88 32 88 66"/></g><rect x="27" y="62" width="9" height="16" rx="4" fill="#E8A35C"/><rect x="84" y="62" width="9" height="16" rx="4" fill="#E8A35C"/>`,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160">${parts.join("")}</svg>`;
}
