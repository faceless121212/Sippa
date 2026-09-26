import { sampleCharacters } from "@/data/landing";
import { CharacterAvatar } from "../CharacterAvatar";
import { buttonClass } from "../ui/button";
import { CreatorMock } from "./CreatorMock";

const faces = ["mara-vellin", "ren-kaito", "ada-lovelace", "dex-okafor", "marcus-aurelius"].map((id) =>
  sampleCharacters.find((c) => c.id === id)!,
);

export function Hero() {
  return (
    <section className="border-border relative border-b" aria-labelledby="hero-title">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,black,transparent_75%)] bg-[size:22px_22px]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <p className="border-border bg-bg text-muted mb-5 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1 text-xs font-medium">
            <span className="bg-primary h-2 w-2 rounded-full ring-2 ring-black/10" aria-hidden="true" />
            AI Character Creator — now brewing
          </p>
          <h1
            id="hero-title"
            className="text-[40px] leading-[1.02] font-extrabold tracking-[-0.035em] text-balance sm:text-6xl lg:text-[68px]"
          >
            Chat with characters who feel real — or{" "}
            <span className="bg-primary text-on-primary rounded-lg box-decoration-clone px-2">
              brew your own
            </span>{" "}
            in seconds.
          </h1>
          <p className="text-muted mt-6 max-w-xl text-lg leading-relaxed">
            Describe anyone in one sentence and Sippa pours out a full character — name, look, personality and
            backstory. Then just start talking.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#creator" className={buttonClass({ size: "lg" })}>
              Create your character
            </a>
            <a href="#vibes" className={buttonClass({ variant: "secondary", size: "lg" })}>
              Explore characters
            </a>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <ul className="flex -space-x-2" aria-label="Some of the characters on Sippa">
              {faces.map((c) => (
                <li key={c.id} className="ring-bg h-9 w-9 overflow-hidden rounded-full ring-2">
                  <CharacterAvatar id={c.id} name={c.name} sizes="36px" />
                </li>
              ))}
            </ul>
            <p className="text-muted text-xs leading-snug">
              Lovers, friends &amp; famous minds.
              <br />
              Free to start · 18+ · Always an AI
            </p>
          </div>
        </div>
        <CreatorMock />
      </div>
    </section>
  );
}
