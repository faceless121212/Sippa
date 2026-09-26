import { buttonClass } from "../ui/button";
import { CreatorMock } from "./CreatorMock";

export function Hero() {
  return (
    <section className="relative overflow-clip" aria-labelledby="hero-title">
      <div
        aria-hidden="true"
        className="bg-primary/20 dark:bg-primary/10 pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="border-border bg-surface text-muted mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" aria-hidden="true" />
            Brew your perfect companion
          </p>
          <h1
            id="hero-title"
            className="font-display text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            Chat with characters who feel real — or{" "}
            <span className="bg-primary text-on-primary rounded-lg box-decoration-clone px-2">
              brew your own
            </span>{" "}
            in seconds.
          </h1>
          <p className="text-muted mt-5 max-w-xl text-lg">
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
          <p className="text-muted mt-4 text-xs">
            Free to start · 18+ only · You&apos;re always chatting with an AI
          </p>
        </div>
        <CreatorMock />
      </div>
    </section>
  );
}
