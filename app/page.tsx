"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui";
import { useTheme } from "@/contexts/ThemeContext";

/* ------------------------------------------------------------------ */
/*  Tiny components                                                    */
/* ------------------------------------------------------------------ */

function ThemeToggleButton() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:text-surface-500 dark:hover:bg-surface-800 dark:hover:text-surface-300"
      aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {resolvedTheme === "dark" ? (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      ) : (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
        </svg>
      )}
    </button>
  );
}

function LogoMark() {
  return (
    <span className="flex items-center gap-2.5 select-none">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white text-sm font-bold shadow-md shadow-primary-500/25">
        IS
      </span>
      <span className="text-lg font-bold tracking-tight text-surface-900 dark:text-white">
        InsightScribe
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  useInView hook for scroll animations                               */
/* ------------------------------------------------------------------ */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedStat({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { ref, isVisible } = useInView(0.3);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isVisible, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl font-bold tabular-nums text-surface-900 dark:text-white sm:text-5xl">
        {count}
        {suffix}
      </div>
      <div className="mt-1 text-sm text-surface-500 dark:text-surface-400">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature card data                                                  */
/* ------------------------------------------------------------------ */

const features = [
  {
    title: "Upload & Transcribe",
    description:
      "Drop in audio or video files. We handle transcription with speaker separation and timestamps automatically.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
      </svg>
    ),
    gradient: "from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    title: "Chat With Interviews",
    description:
      "Ask questions across all your interviews at once. Get synthesized answers with source quotes and timestamps.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
    gradient: "from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    title: "Structured Themes",
    description:
      "Automatically surface feature requests, pain points, and sentiment clusters ranked by frequency.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
      </svg>
    ),
    gradient: "from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    title: "Quotes & Evidence",
    description:
      "Every insight links back to the exact quote, speaker, and timestamp so you can verify claims in seconds.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    gradient: "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    title: "Insight Reports",
    description:
      "Generate pre-built analysis reports: top feature requests, frustration themes, onboarding feedback, and more.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    gradient: "from-rose-500/10 to-pink-500/10 dark:from-rose-500/20 dark:to-pink-500/20",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    title: "Multi-Project Workspace",
    description:
      "Organize interviews by project. Keep your research segmented and query within or across projects.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
      </svg>
    ),
    gradient: "from-sky-500/10 to-indigo-500/10 dark:from-sky-500/20 dark:to-indigo-500/20",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
];

const steps = [
  {
    num: "01",
    label: "Upload interviews",
    sub: "Drag & drop audio, video, or text files",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
      </svg>
    ),
  },
  {
    num: "02",
    label: "AI processes them",
    sub: "Automatic transcription, chunking & embedding",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
  },
  {
    num: "03",
    label: "Ask anything",
    sub: "Chat across all interviews with RAG",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
      </svg>
    ),
  },
  {
    num: "04",
    label: "Get insights",
    sub: "Themes, quotes, sentiment & export",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Pricing data                                                       */
/* ------------------------------------------------------------------ */

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for trying out InsightScribe with a small project.",
    highlight: false,
    cta: "Get started free",
    features: [
      "3 interviews per project",
      "1 project",
      "Basic AI chat queries",
      "7-day transcript retention",
      "Community support",
    ],
    limitations: ["No insight reports", "No CSV export"],
  },
  {
    name: "Pro",
    price: "$39",
    period: "/month",
    description: "For product teams running ongoing user research.",
    highlight: true,
    cta: "Start 14-day free trial",
    features: [
      "Unlimited interviews",
      "Unlimited projects",
      "Unlimited AI chat queries",
      "Full insight reports",
      "CSV & Notion export",
      "Speaker identification",
      "Priority processing",
      "Email support",
    ],
    limitations: [],
  },
  {
    name: "Team",
    price: "$79",
    period: "/seat/month",
    description: "For research teams who need collaboration and admin controls.",
    highlight: false,
    cta: "Contact sales",
    features: [
      "Everything in Pro",
      "Team workspaces",
      "Role-based access",
      "Shared insight library",
      "API access",
      "Custom analysis templates",
      "SSO & audit logs",
      "Dedicated support",
    ],
    limitations: [],
  },
];

/* ------------------------------------------------------------------ */
/*  Testimonials data                                                  */
/* ------------------------------------------------------------------ */

const testimonials = [
  {
    quote: "InsightScribe cut our research synthesis time from 2 days to 20 minutes. It's become essential to our product discovery flow.",
    name: "Sarah Chen",
    title: "Head of Product, Acme Corp",
    avatar: "SC",
  },
  {
    quote: "The ability to chat across all interviews and get source quotes instantly changed how our team makes feature decisions.",
    name: "Marcus Johnson",
    title: "UX Research Lead, Linear",
    avatar: "MJ",
  },
  {
    quote: "We replaced three tools with InsightScribe. The structured themes and sentiment analysis are exactly what PMs need.",
    name: "Aisha Patel",
    title: "Senior PM, Notion",
    avatar: "AP",
  },
];

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */

const faqs = [
  {
    q: "What file formats do you support?",
    a: "We support MP3, WAV, and MP4 files. Upload interviews recorded on Zoom, Google Meet, or any other platform.",
  },
  {
    q: "How accurate is the transcription?",
    a: "We use OpenAI Whisper for transcription, achieving 95%+ accuracy across most accents and languages. Speaker separation is automatic.",
  },
  {
    q: "Is my research data secure?",
    a: "Absolutely. All files are encrypted at rest and in transit. We never use your data to train models. SOC 2 compliance is in progress.",
  },
  {
    q: "Can I query across multiple interviews?",
    a: "Yes — that's our core strength. Our RAG engine lets you ask questions across all interviews in a project and get synthesized answers with source citations.",
  },
  {
    q: "What happens when my free trial ends?",
    a: "You can continue using the Free tier with limited features, or upgrade to Pro. No data is deleted when switching plans.",
  },
];

/* ------------------------------------------------------------------ */
/*  FAQ Accordion item                                                 */
/* ------------------------------------------------------------------ */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-surface-200 dark:border-surface-700">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium text-surface-900 transition-colors hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
      >
        {q}
        <svg
          className={`h-5 w-5 shrink-0 text-surface-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40 pb-5" : "max-h-0"}`}
      >
        <p className="text-sm leading-relaxed text-surface-500 dark:text-surface-400">{a}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const statsSection = useInView(0.2);
  const featuresSection = useInView(0.1);
  const pricingSection = useInView(0.1);

  return (
    <div className="min-h-screen bg-white dark:bg-surface-950">
      {/* ───────── Nav ───────── */}
      <nav className="sticky top-0 z-50 border-b border-surface-100/80 bg-white/70 backdrop-blur-xl dark:border-surface-800/80 dark:bg-surface-950/70">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <LogoMark />

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-white">Features</a>
            <a href="#how-it-works" className="text-sm text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-white">How it works</a>
            <a href="#pricing" className="text-sm text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-white">Pricing</a>
            <a href="#faq" className="text-sm text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-white">FAQ</a>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggleButton />
            <Link
              href="/login"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-surface-600 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-white sm:inline-flex"
            >
              Log in
            </Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-surface-100 bg-white px-5 py-4 dark:border-surface-800 dark:bg-surface-950 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-sm text-surface-600 dark:text-surface-300">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm text-surface-600 dark:text-surface-300">How it works</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm text-surface-600 dark:text-surface-300">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-sm text-surface-600 dark:text-surface-300">FAQ</a>
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm text-surface-600 dark:text-surface-300">Log in</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        {/* Animated gradient mesh */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-br from-primary-400/20 via-violet-400/10 to-transparent blur-3xl dark:from-primary-500/10 dark:via-violet-500/5 animate-hero-glow" />
          <div className="absolute top-20 -right-20 h-72 w-72 rounded-full bg-gradient-to-bl from-cyan-400/15 to-transparent blur-3xl dark:from-cyan-500/10 animate-hero-glow-delayed" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-tr from-violet-400/10 to-transparent blur-3xl dark:from-violet-500/5" />
        </div>

        {/* Grid pattern overlay */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(0_0_0/0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgb(0_0_0/0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black_70%,transparent_100%)] dark:bg-[linear-gradient(to_right,rgb(255_255_255/0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.03)_1px,transparent_1px)]"
        />

        <div className="relative mx-auto max-w-4xl px-5 pb-24 pt-20 sm:pt-32 lg:pt-40 text-center">
          {/* Pill badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary-200/60 bg-primary-50/80 px-4 py-1.5 text-xs font-medium text-primary-700 backdrop-blur-sm dark:border-primary-800/60 dark:bg-primary-950/40 dark:text-primary-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary-500" />
            </span>
            AI-Powered Research Intelligence
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-surface-900 dark:text-white sm:text-6xl lg:text-7xl">
            Stop re-watching
            <br />
            interviews.{" "}
            <span className="bg-gradient-to-r from-primary-600 via-violet-600 to-primary-600 bg-clip-text text-transparent dark:from-primary-400 dark:via-violet-400 dark:to-primary-400">
              Start shipping insights.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-surface-500 dark:text-surface-400 sm:text-xl">
            Upload customer interviews and let AI extract feature requests, pain points, and sentiment themes — with source quotes you can actually trust.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full px-8 py-3.5 text-base shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 sm:w-auto">
                Start free — no card needed
              </Button>
            </Link>
            <a
              href="#how-it-works"
              className="group inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white/80 px-6 py-3.5 text-sm font-medium text-surface-700 shadow-sm backdrop-blur-sm transition-all hover:border-surface-300 hover:shadow-md dark:border-surface-700 dark:bg-surface-800/80 dark:text-surface-300 dark:hover:border-surface-600"
            >
              See how it works
              <svg className="h-4 w-4 transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
              </svg>
            </a>
          </div>

          {/* Social proof strip */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <p className="text-xs font-medium tracking-widest text-surface-400 uppercase dark:text-surface-500">
              Trusted by product teams at
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
              {["Acme Corp", "Basecamp", "Linear", "Notion", "Vercel"].map(
                (name) => (
                  <span
                    key={name}
                    className="text-base font-semibold tracking-tight text-surface-300 transition-colors hover:text-surface-400 dark:text-surface-600 dark:hover:text-surface-500"
                  >
                    {name}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Stats ───────── */}
      <section className="border-t border-surface-100 dark:border-surface-800">
        <div
          ref={statsSection.ref}
          className={`mx-auto max-w-5xl px-5 py-16 sm:py-20 transition-all duration-700 ${statsSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <AnimatedStat value={95} suffix="%" label="Transcription accuracy" />
            <AnimatedStat value={10} suffix="x" label="Faster than manual" />
            <AnimatedStat value={500} suffix="+" label="Teams using it" />
            <AnimatedStat value={50} suffix="k" label="Interviews processed" />
          </div>
        </div>
      </section>

      {/* ───────── How it works ───────── */}
      <section
        id="how-it-works"
        className="border-t border-surface-100 bg-gradient-to-b from-surface-50/80 to-white dark:border-surface-800 dark:from-surface-900/50 dark:to-surface-950"
      >
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="text-center">
            <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
              How it works
            </span>
            <h2 className="mt-4 text-3xl font-bold text-surface-900 dark:text-white sm:text-4xl">
              Four steps. Zero re-watching.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-surface-500 dark:text-surface-400">
              From raw recordings to actionable product insights in minutes.
            </p>
          </div>

          <div className="relative mt-16">
            {/* Connecting line */}
            <div
              aria-hidden
              className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200 dark:from-primary-800 dark:via-primary-700 dark:to-primary-800 lg:left-1/2 lg:block"
            />

            <div className="grid gap-12 lg:gap-0">
              {steps.map((s, i) => (
                <div key={s.num} className={`relative lg:grid lg:grid-cols-2 lg:gap-12 ${i > 0 ? "lg:mt-0" : ""}`}>
                  {/* Timeline dot */}
                  <div
                    aria-hidden
                    className="absolute left-[29px] top-1 z-10 hidden h-3.5 w-3.5 rounded-full border-[3px] border-primary-500 bg-white dark:bg-surface-950 lg:left-1/2 lg:-translate-x-1/2 lg:block"
                  />

                  <div className={`${i % 2 === 0 ? "lg:pr-16 lg:text-right" : "lg:col-start-2 lg:pl-16"}`}>
                    <div className={`rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-900 ${i % 2 !== 0 ? "" : ""}`}>
                      <div className={`flex items-center gap-4 ${i % 2 === 0 ? "lg:flex-row-reverse" : ""}`}>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
                          {s.icon}
                        </div>
                        <div className={i % 2 === 0 ? "lg:text-right" : ""}>
                          <span className="text-xs font-bold tabular-nums text-primary-500/60 dark:text-primary-400/50">
                            STEP {s.num}
                          </span>
                          <h3 className="text-base font-semibold text-surface-900 dark:text-white">
                            {s.label}
                          </h3>
                        </div>
                      </div>
                      <p className={`mt-3 text-sm leading-relaxed text-surface-500 dark:text-surface-400 ${i % 2 === 0 ? "lg:text-right" : ""}`}>
                        {s.sub}
                      </p>
                    </div>
                  </div>

                  {/* Empty column for alternating layout */}
                  {i % 2 === 0 && <div className="hidden lg:block" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Features ───────── */}
      <section id="features" className="border-t border-surface-100 dark:border-surface-800">
        <div
          ref={featuresSection.ref}
          className="mx-auto max-w-6xl px-5 py-20 sm:py-28"
        >
          <div className="text-center">
            <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
              Capabilities
            </span>
            <h2 className="mt-4 text-3xl font-bold text-surface-900 dark:text-white sm:text-4xl">
              Everything you need to go from
              <br className="hidden sm:block" />
              recordings to roadmap.
            </h2>
          </div>

          <div
            className={`mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-700 ${featuresSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-surface-200/80 bg-white p-6 transition-all duration-300 hover:border-surface-300 hover:shadow-lg hover:-translate-y-1 dark:border-surface-700/80 dark:bg-surface-900 dark:hover:border-surface-600"
                style={{ transitionDelay: `${i * 75}ms` }}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />

                <div className="relative">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-surface-50 ${f.iconColor} transition-colors group-hover:bg-white dark:bg-surface-800 dark:group-hover:bg-surface-800`}>
                    {f.icon}
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-surface-900 dark:text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-surface-500 dark:text-surface-400">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Pricing ───────── */}
      <section
        id="pricing"
        className="border-t border-surface-100 bg-gradient-to-b from-surface-50/80 to-white dark:border-surface-800 dark:from-surface-900/50 dark:to-surface-950"
      >
        <div
          ref={pricingSection.ref}
          className="mx-auto max-w-6xl px-5 py-20 sm:py-28"
        >
          <div className="text-center">
            <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
              Pricing
            </span>
            <h2 className="mt-4 text-3xl font-bold text-surface-900 dark:text-white sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-surface-500 dark:text-surface-400">
              Start free. Upgrade when your research needs grow. No hidden fees.
            </p>
          </div>

          <div
            className={`mt-14 grid gap-8 lg:grid-cols-3 transition-all duration-700 ${pricingSection.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 transition-all duration-300 hover:shadow-xl ${
                  plan.highlight
                    ? "border-primary-500 bg-white shadow-lg shadow-primary-500/10 dark:border-primary-500 dark:bg-surface-900 ring-1 ring-primary-500/20"
                    : "border-surface-200 bg-white hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900 dark:hover:border-surface-600"
                }`}
              >
                {/* Popular badge */}
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary-600 to-violet-600 px-4 py-1 text-xs font-semibold text-white shadow-md">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                      </svg>
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-surface-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-surface-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-sm text-surface-500 dark:text-surface-400">
                    {plan.period}
                  </span>
                </div>

                <Link href="/register" className="mb-8">
                  <Button
                    size="lg"
                    variant={plan.highlight ? "primary" : "secondary"}
                    className="w-full justify-center"
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <div className="flex-1">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400 dark:text-surface-500">
                    What&apos;s included
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-surface-700 dark:text-surface-300">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-start gap-3 text-sm text-surface-400 dark:text-surface-500">
                        <svg className="mt-0.5 h-4 w-4 shrink-0 text-surface-300 dark:text-surface-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Testimonials ───────── */}
      <section className="border-t border-surface-100 dark:border-surface-800">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="text-center">
            <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
              Testimonials
            </span>
            <h2 className="mt-4 text-3xl font-bold text-surface-900 dark:text-white sm:text-4xl">
              Loved by product teams
            </h2>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="relative rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-surface-700 dark:bg-surface-900"
              >
                {/* Quote mark */}
                <svg className="mb-4 h-8 w-8 text-primary-200 dark:text-primary-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 0 1-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179Z" />
                </svg>

                <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-300">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-xs font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── FAQ ───────── */}
      <section
        id="faq"
        className="border-t border-surface-100 bg-gradient-to-b from-surface-50/80 to-white dark:border-surface-800 dark:from-surface-900/50 dark:to-surface-950"
      >
        <div className="mx-auto max-w-3xl px-5 py-20 sm:py-28">
          <div className="text-center">
            <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-600 dark:bg-primary-950/50 dark:text-primary-400">
              FAQ
            </span>
            <h2 className="mt-4 text-3xl font-bold text-surface-900 dark:text-white sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="mt-12">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ───────── CTA band ───────── */}
      <section className="border-t border-surface-100 dark:border-surface-800">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:py-28">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-surface-900 to-surface-800 px-8 py-16 text-center dark:from-surface-800 dark:via-surface-800 dark:to-surface-700 sm:px-16 sm:py-20">
            {/* Decorative elements */}
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-[500px] rounded-full bg-primary-500/20 blur-3xl" />
              <div className="absolute bottom-0 right-0 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
            </div>

            <div className="relative">
              <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
                Ready to turn interviews
                <br className="hidden sm:block" />
                into action?
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-surface-300">
                Join product teams who spend minutes — not hours — extracting research insights. Start free today.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-white text-surface-900 shadow-lg hover:bg-surface-100 focus:ring-white"
                  >
                    Get started for free
                  </Button>
                </Link>
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 text-sm font-medium text-surface-300 transition-colors hover:text-white"
                >
                  View pricing
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-surface-100 dark:border-surface-800">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand column */}
            <div className="lg:col-span-1">
              <LogoMark />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-surface-500 dark:text-surface-400">
                AI-powered research intelligence platform. Turn customer interviews into structured product insights.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-900 dark:text-white">
                Product
              </h4>
              <ul className="mt-4 space-y-3">
                {["Features", "Pricing", "How it works", "Changelog"].map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-900 dark:text-white">
                Company
              </h4>
              <ul className="mt-4 space-y-3">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-900 dark:text-white">
                Legal
              </h4>
              <ul className="mt-4 space-y-3">
                {["Privacy Policy", "Terms of Service", "Security", "GDPR"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-sm text-surface-500 transition-colors hover:text-surface-900 dark:text-surface-400 dark:hover:text-white">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-surface-100 pt-8 dark:border-surface-800 sm:flex-row">
            <p className="text-xs text-surface-400 dark:text-surface-500">
              &copy; {new Date().getFullYear()} InsightScribe. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              {/* Social icons */}
              <a href="#" className="text-surface-400 transition-colors hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300" aria-label="Twitter">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0 0 22 5.92a8.19 8.19 0 0 1-2.357.646 4.118 4.118 0 0 0 1.804-2.27 8.224 8.224 0 0 1-2.605.996 4.107 4.107 0 0 0-6.993 3.743 11.65 11.65 0 0 1-8.457-4.287 4.106 4.106 0 0 0 1.27 5.477A4.072 4.072 0 0 1 2.8 9.713v.052a4.105 4.105 0 0 0 3.292 4.022 4.095 4.095 0 0 1-1.853.07 4.108 4.108 0 0 0 3.834 2.85A8.233 8.233 0 0 1 2 18.407a11.616 11.616 0 0 0 6.29 1.84" /></svg>
              </a>
              <a href="#" className="text-surface-400 transition-colors hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300" aria-label="GitHub">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" clipRule="evenodd" /></svg>
              </a>
              <a href="#" className="text-surface-400 transition-colors hover:text-surface-600 dark:text-surface-500 dark:hover:text-surface-300" aria-label="LinkedIn">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065Zm1.782 13.019H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
