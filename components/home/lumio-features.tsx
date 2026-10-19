"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

const FEATURES = [
  {
    title: "Start creating",
    description: "Choose a template, a size preset, or custom dimensions for your design.",
    items: ["14 editable templates", "12 size presets", "Custom canvas dimensions"],
  },
  {
    title: "Make it yours",
    description: "Arrange text, shapes, and images across one or more pages.",
    items: ["Text styling and bundled fonts", "Layers, guides, and undo/redo", "Automatic saves and named versions"],
  },
  {
    title: "Share your work",
    description: "Download your design or let someone view and copy it through a share link.",
    items: ["PNG, JPG, SVG, and PDF exports", "View-only share links", "Copy a shared design"],
  },
];

export function LumioFeatures() {
  return (
    <section id="features" className="scroll-mt-24 py-20 lg:py-28 bg-white border-t border-ink-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-lumio-purple-light px-3.5 py-1 text-xs font-bold text-lumio-purple">
            <Sparkles className="h-3.5 w-3.5" />
            <span>What you can do with Lumio</span>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-5xl">
            From first idea to <span className="lumio-gradient-text">finished design</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-ink-600">
            Create, edit, export, and share from your browser.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {FEATURES.map((feature, index) => (
            <div
              key={feature.title}
              className={`flex flex-col justify-between rounded-3xl bg-white p-8 transition-all ${
                index === 1
                  ? "border-2 border-lumio-purple shadow-xl"
                  : "border border-ink-200/80 shadow-sm hover:shadow-lumio-landing-card"
              }`}
            >
              <div>
                <h3 className="text-2xl font-bold text-ink-950">{feature.title}</h3>
                <p className="mt-2 text-sm text-ink-500">{feature.description}</p>
                <div className="mt-8 space-y-3.5 border-t border-ink-100 pt-6">
                  {feature.items.map((item) => (
                    <div key={item} className="flex items-center gap-3 text-sm text-ink-700">
                      <Check className="h-4 w-4 shrink-0 text-lumio-purple" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-ink-100">
                <Link
                  href="/signup"
                  className={`flex h-12 w-full items-center justify-center rounded-full font-bold ${
                    index === 1
                      ? "lumio-gradient-btn shadow-md"
                      : "border border-ink-300 text-ink-900 transition-colors hover:bg-ink-50"
                  }`}
                >
                  Start designing
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
