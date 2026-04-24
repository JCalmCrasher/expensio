import Link from "next/link";
import { ArrowRight, Zap, ShieldCheck, RefreshCw } from "lucide-react";
import { TextType } from "@/components/TextType";
import { DataMockup } from "@/components/DataMockup";
import { QuickAddMockup } from "@/components/QuickAddMockup";
import { Logo } from "@/components/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Nav */}
      <header className="mx-auto w-full max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="text-sm font-bold tracking-tight text-white">Expensio</span>
        </div>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/8 border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors duration-150 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          Open app <ArrowRight size={13} />
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col">
        {/* Hero section — two column */}
        <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-24 flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-12">
          {/* Left: copy */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              Local-first · No account needed
            </div>

            {/* Typewriter headline */}
            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl lg:text-[56px]">
              <span className="block">Manage your</span>
              <span className="block min-h-[1.1em]">
                <TextType
                  phrases={["expenses.", "finances.", "budget."]}
                  className="bg-linear-to-r from-green-400 to-teal-400 bg-clip-text text-transparent"
                  typingSpeed={110}
                  deletingSpeed={55}
                  pauseMs={2800}
                />
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-500 sm:text-lg lg:mx-0 mx-auto">
              Add an expense in seconds with a single line of text. Watch your progress bar fill up
              as you pay it off. Everything lives in your browser; no sign-up, no sync, no server.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row lg:justify-start justify-center">
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-green-900/50 transition-all duration-150 hover:bg-green-500 hover:shadow-green-800/60 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 whitespace-nowrap"
              >
                Get started <ArrowRight size={15} />
              </Link>
              <span className="text-xs text-zinc-600">Works offline after first load.</span>
            </div>
          </div>

          {/* Right: data mockup */}
          <div className="flex-1 flex justify-center lg:justify-end w-full max-w-sm lg:max-w-none mx-auto">
            <DataMockup />
          </div>
        </section>

        {/* Feature section — Instant capture with live mockup */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-20">
          {/* Top: two-column — copy left, QuickAddMockup right */}
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16 mb-16">
            {/* QuickAdd mockup */}
            <div className="flex-1 flex justify-center lg:justify-start w-full max-w-sm lg:max-w-lg mx-auto">
              <QuickAddMockup />
            </div>
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/15 text-green-400">
                <Zap size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Add an expense in seconds
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-500">
                Type a natural-language line like{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 text-green-300 text-sm">
                  Rent 1200
                </code>{" "}
                or{" "}
                <code className="rounded bg-white/5 px-1.5 py-0.5 text-green-300 text-sm">
                  Coffee 4.50 paid
                </code>{" "}
                and press Enter. No forms, no dropdowns, no friction.
              </p>
              <ul className="mt-5 space-y-2 text-sm text-zinc-500">
                {[
                  "Amount extracted automatically",
                  'Status set from "paid" / "unpaid" keyword',
                  "Default priority assigned instantly",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom: remaining feature cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                icon: RefreshCw,
                title: "Monthly rollover",
                body: "Roll unpaid expenses into the next month with one click, preserving their paid progress.",
              },
              {
                icon: ShieldCheck,
                title: "Stays on your device",
                body: "All data is stored in your browser (IndexedDB). Works offline after first load — no server, no account.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/5 bg-white/2.5 p-5 text-left transition-colors duration-150 hover:bg-white/4 hover:border-white/10"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/15 text-green-400">
                  <Icon size={17} />
                </div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quick-add syntax */}
        <section className="mx-auto w-full max-w-md px-6 pb-24 text-center">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
            Quick add syntax
          </p>
          <div className="rounded-2xl border border-white/5 bg-white/2.5 px-5 py-4 text-left space-y-2.5">
            {[
              { input: "Coffee 4.50", note: "unpaid · Medium priority" },
              { input: "Rent 1200 paid", note: "marked as paid" },
              { input: "Gym 50 high", note: "High priority" },
              { input: "Netflix 15 low", note: "Low priority" },
            ].map(({ input, note }) => (
              <div key={input} className="flex items-center justify-between gap-4">
                <code className="text-sm font-semibold text-green-300">{input}</code>
                <span className="text-xs text-zinc-600">{note}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="py-8 text-center text-xs text-zinc-700">
        No account needed · All data stays in your browser · 100% yours.
      </footer>
    </div>
  );
}
