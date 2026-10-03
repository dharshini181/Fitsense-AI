"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  LayoutGrid,
  Shirt as ShirtIcon,
  ShoppingCart,
  Plane,
  CalendarClock,
  BarChart3,
  Sun,
  Briefcase,
  Smile,
  Palette,
} from "lucide-react";
import Reveal from "@/components/Reveal";

/* Hero photo (user-provided) and real crops of the same photo for each
   visible garment — not stock photos, actual regions of the uploaded shot. */
const HERO_MODEL = "/images/hero-model.png";
const CTA_MODEL =
  "https://images.unsplash.com/photo-1751799671223-3f561e0f5286?auto=format&fit=crop&q=80&w=700";
const BLAZER_IMG = "/images/item-blazer.png";
const TOP_IMG = "/images/item-top.png";
const TROUSERS_IMG = "/images/item-trousers.png";
const BAG_IMG =
  "https://images.unsplash.com/photo-1588056421330-045073ab19b7?auto=format&fit=crop&q=80&w=300";
const HEELS_IMG =
  "https://images.unsplash.com/photo-1685954134741-a699bf8807c8?auto=format&fit=crop&q=80&w=300";
/* Bag and heels aren't visible in the source photo, so these render as
   clean on-brand icon cards below rather than mismatched stock photos. */

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative text-sm font-medium group py-1">
      {children}
      <span className="absolute left-0 -bottom-0.5 h-[1.5px] w-0 bg-[#595800] transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

const features = [
  { icon: Sparkles, title: "AI Stylist", desc: "Ask anything, get styled instantly." },
  { icon: LayoutGrid, title: "Smart Wardrobe", desc: "Digitize, organize, and rediscover." },
  { icon: ShirtIcon, title: "Outfit Generator", desc: "Personalized looks for every occasion." },
  { icon: Palette, title: "Style Analysis", desc: "Colors, silhouettes, and more." },
  { icon: ShoppingCart, title: "Smart Shopping", desc: "Avoid duplicates. Buy with confidence." },
  { icon: Plane, title: "Travel Assistant", desc: "Pack smart for any destination." },
  { icon: CalendarClock, title: "Weekly Planner", desc: "Plan outfits. Save time daily." },
  { icon: BarChart3, title: "Fashion Analytics", desc: "Understand habits. Improve style." },
];

const stylistPrompts = [
  "What should I wear today?",
  "I have a meeting. What should I wear?",
  "Style these jeans for dinner.",
  "What should I pack for my trip?",
];

const outfitPieces = [
  { name: "Blazer", img: BLAZER_IMG },
  { name: "Top", img: TOP_IMG },
  { name: "Trousers", img: TROUSERS_IMG },
  { name: "Bag", img: BAG_IMG },
  { name: "Heels", img: HEELS_IMG },
];

const steps = [
  { n: "01", title: "You Share", desc: "Add your wardrobe, preferences and lifestyle details." },
  { n: "02", title: "AI Understands", desc: "Our AI analyzes your style, habits and needs." },
  { n: "03", title: "Personalized Results", desc: "Get outfit ideas, tips and recommendations made for you." },
  { n: "04", title: "You Improve", desc: "Save, like, or give feedback. AI learns and improves every day." },
];

export default function LandingPage() {
  return (
    <main className="bg-background text-foreground min-h-screen overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-nav">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-container-padding-mobile md:px-container-padding-desktop h-20">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo/fitsense-logo.png"
              alt="FitSense AI"
              width={155}
              height={50}
              priority
              className="h-10 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <NavLink href="/auth">AI Stylist</NavLink>
            <NavLink href="/auth">Wardrobe</NavLink>
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#stylist">About</NavLink>
            <NavLink href="#how-it-works">How It Works</NavLink>
          </nav>

          <Link
            href="/onboarding"
            className="btn-primary px-5 py-2.5 text-sm font-semibold rounded-full"
          >
            Start Your Style Journey →
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-container-padding-mobile md:px-container-padding-desktop pt-10 md:pt-14 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <Reveal direction="left">
            <p className="text-sm font-semibold mb-4 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-container" fill="currentColor" />
              YOUR PERSONAL AI FASHION ASSISTANT
            </p>
            <h1 className="font-display text-headline-lg-mobile md:text-display-lg font-bold tracking-tight mb-6 leading-[1.05]">
              Dress Smarter.
              <br />
              Shop Smarter.
              <br />
              Look Better.
            </h1>
            <p className="text-body-lg mb-8 max-w-md opacity-80">
              FitSense AI understands you, your wardrobe, your lifestyle and
              your world — to create fashion that&apos;s truly yours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                href="/onboarding"
                className="btn-primary h-14 px-8 rounded-2xl font-semibold text-button flex items-center justify-center gap-2"
              >
                Start Your Style Journey →
              </Link>
              <Link
                href="#stylist"
                className="btn-secondary h-14 px-8 rounded-2xl font-semibold text-button flex items-center justify-center"
              >
                Explore FitSense AI
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-xs font-medium opacity-80">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Stylist — 24/7 Personal Assistant
              </span>
              <span className="flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5" /> Smart Wardrobe — Organize &amp; Discover
              </span>
            </div>
          </Reveal>

          <Reveal direction="scale" delay={0.1}>
            <div className="relative aspect-[4/5] max-w-md mx-auto">
              <div
                className="absolute rounded-full"
                style={{
                  width: "88%",
                  height: "88%",
                  right: 0,
                  top: "6%",
                  backgroundColor: "var(--primary-container)",
                  opacity: 0.55,
                }}
              />
              <Image
                src={HERO_MODEL}
                alt="Fashion model styled by FitSense AI"
                fill
                priority
                sizes="(max-width: 768px) 90vw, 448px"
                className="relative z-10 object-contain object-bottom"
              />

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: [0, -6, 0] }}
                transition={{ opacity: { delay: 0.4, duration: 0.5 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
                className="absolute -left-4 top-8 z-20 glass-white rounded-2xl px-4 py-3 text-xs w-32"
              >
                <p className="opacity-70 mb-1">Today&apos;s Weather</p>
                <p className="text-xl font-bold flex items-center gap-1">
                  <Sun className="w-4 h-4 text-primary-container" fill="currentColor" /> 28°
                </p>
                <p className="opacity-70">Sunny · Light Layers</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: [0, 6, 0] }}
                transition={{ opacity: { delay: 0.55, duration: 0.5 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
                className="absolute -left-4 bottom-24 z-20 glass-white rounded-2xl px-4 py-3 text-xs w-32"
              >
                <p className="opacity-70 mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Occasion
                </p>
                <p className="font-semibold">Work</p>
                <p className="opacity-70">Business Meeting</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: [0, -6, 0] }}
                transition={{ opacity: { delay: 0.7, duration: 0.5 }, x: { duration: 5.5, repeat: Infinity, ease: "easeInOut" } }}
                className="absolute -right-2 top-6 z-20 glass-white rounded-2xl p-3 text-xs w-28"
              >
                <p className="opacity-70 mb-2">Recommended</p>
                <div className="grid grid-cols-2 gap-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={BLAZER_IMG} alt="Blazer" className="w-full h-10 object-cover rounded-md" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={TROUSERS_IMG} alt="Trousers" className="w-full h-10 object-cover rounded-md" />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: [0, -5, 0] }}
                transition={{ opacity: { delay: 0.85, duration: 0.5 }, y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" } }}
                className="absolute -right-2 bottom-6 z-20 glass-white rounded-2xl px-4 py-3 text-xs text-center w-28"
              >
                <p className="opacity-70 mb-1">Style Match</p>
                <p className="text-lg font-bold" style={{ color: "#595800" }}>94%</p>
                <p className="opacity-70">Great Match!</p>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Feature strip ───────────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-container-padding-mobile md:px-container-padding-desktop pb-16 scroll-mt-28">
        <Reveal direction="roll">
          <h2 className="text-center font-display text-headline-lg-mobile md:text-headline-xl font-bold tracking-tight mb-12">
            Everything You Need for Smarter Fashion
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => {
            const fromLeft = i % 2 === 0;
            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: fromLeft ? -90 : 90, rotate: fromLeft ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.75, delay: (i % 4) * 0.1, ease: [0.34, 1.3, 0.64, 1] }}
                className="text-center group cursor-default"
              >
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center border border-[#595800]/15 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-transparent group-hover:bg-[#F5FF00] group-hover:shadow-[0_8px_20px_rgba(89,88,0,0.15)]">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-xs opacity-70">{desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── AI Stylist + Outfit of the Day ─────────────────────────── */}
      <section id="stylist" className="max-w-7xl mx-auto px-container-padding-mobile md:px-container-padding-desktop pb-16 scroll-mt-28">
        <div className="grid md:grid-cols-2 gap-6">
          <Reveal direction="left">
            <div className="editorial-card style-card p-8 h-full">
              <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary-container" fill="currentColor" /> AI STYLIST
              </p>
              <h3 className="font-display text-2xl font-bold mb-6">Ask. Discover. Get Styled.</h3>

              <div className="space-y-2 mb-6">
                {stylistPrompts.map((p) => (
                  <div key={p} className="border border-[#595800]/15 rounded-xl px-4 py-3 text-sm">
                    {p}
                  </div>
                ))}
              </div>

              <div className="chip rounded-2xl p-4 mb-4">
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Search className="w-3 h-3" /> FitSense AI
                </p>
                <p className="text-sm mb-3">Here&apos;s a smart outfit for your meeting today.</p>
                <div className="grid grid-cols-3 gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={BLAZER_IMG} alt="Blazer" className="w-full h-16 object-cover rounded-lg" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={TROUSERS_IMG} alt="Trousers" className="w-full h-16 object-cover rounded-lg" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={BAG_IMG} alt="Bag" className="w-full h-16 object-cover rounded-lg" />
                </div>
              </div>

              <Link href="/auth" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold">
                Chat with AI Stylist →
              </Link>
            </div>
          </Reveal>

          <Reveal direction="right" delay={0.1}>
            <div className="editorial-card style-card p-8 h-full">
              <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary-container" fill="currentColor" /> OUTFIT OF THE DAY
              </p>
              <h3 className="font-display text-2xl font-bold mb-4">Made for Your Day. Made for You.</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="chip text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Sun className="w-3 h-3" /> 28°C Sunny
                </span>
                <span className="border border-[#595800]/20 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> Business Meeting
                </span>
                <span className="border border-[#595800]/20 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
                  <Smile className="w-3 h-3" /> Confident
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-6">
                {outfitPieces.map((p) => (
                  <div key={p.name} className="text-center group cursor-default">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.img} alt={p.name} className="w-full aspect-square object-cover rounded-lg mb-1 transition-transform duration-300 group-hover:scale-105" />
                    <p className="text-[10px] opacity-70">{p.name}</p>
                  </div>
                ))}
              </div>
              <Link href="/auth" className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold">
                View Full Look →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Fashion Analytics ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-container-padding-mobile md:px-container-padding-desktop pb-12">
        <div className="glass-panel rounded-[28px] p-8 md:p-12">
          <Reveal direction="scale">
            <p className="text-xs font-semibold mb-3 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-primary-container" fill="currentColor" /> FASHION INSIGHTS
            </p>
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-8 max-w-md">
              Understand Your Wardrobe. Improve Your Style.
            </h3>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Reveal direction="roll" delay={0.05}>
              <div className="data-card style-card p-5 h-full">
                <p className="text-xs font-semibold mb-3">Wardrobe Usage</p>
                <div className="relative w-20 h-20 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#595800" strokeOpacity="0.12" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none" stroke="#F5FF00" strokeWidth="3"
                      strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.78)} strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">78%</span>
                </div>
                <p className="text-[11px] text-center opacity-70 mt-2">Used</p>
              </div>
            </Reveal>

            <Reveal direction="scale" delay={0.1}>
              <div className="data-card style-card p-5 h-full">
                <p className="text-xs font-semibold mb-3">Style Preferences</p>
                <div className="space-y-2">
                  {[["Minimal", 64], ["Classic", 21], ["Streetwear", 10], ["Others", 5]].map(([label, val]) => (
                    <div key={label as string}>
                      <div className="flex justify-between text-[10px] mb-0.5">
                        <span>{label}</span>
                        <span>{val}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#595800]/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${val}%`, backgroundColor: "#F5FF00" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal direction="roll" delay={0.15}>
              <div className="data-card style-card p-5 h-full flex flex-col justify-between">
                <p className="text-xs font-semibold mb-3">Cost Per Wear</p>
                <p className="text-2xl font-bold">₹18.40</p>
                <p className="text-[11px] opacity-70">Per Wear</p>
              </div>
            </Reveal>

            <Reveal direction="scale" delay={0.2}>
              <div className="data-card style-card p-5 h-full">
                <p className="text-xs font-semibold mb-3">Top Colors</p>
                <div className="grid grid-cols-3 gap-2">
                  {["#D6C88A", "#EDEADF", "#E7B49A", "#595800", "#3A3A00", "#8A9400"].map((c) => (
                    <div key={c} className="w-full aspect-square rounded-full border border-[#595800]/10" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal direction="roll" delay={0.25}>
              <div className="data-card style-card p-5 h-full">
                <p className="text-xs font-semibold mb-3">Most Worn Items</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={BLAZER_IMG} alt="Blazer" className="w-full aspect-square object-cover rounded-md" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={TROUSERS_IMG} alt="Trousers" className="w-full aspect-square object-cover rounded-md" />
                </div>
              </div>
            </Reveal>

            <Reveal direction="scale" delay={0.3}>
              <div className="data-card style-card p-5 h-full">
                <p className="text-xs font-semibold mb-3">Sustainability Score</p>
                <div className="relative w-20 h-20 mx-auto">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#595800" strokeOpacity="0.12" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none" stroke="#595800" strokeWidth="3"
                      strokeDasharray="97.4" strokeDashoffset={97.4 * (1 - 0.86)} strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">86%</span>
                </div>
                <p className="text-[11px] text-center opacity-70 mt-2">Good</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── How FitSense AI Works ──────────────────────────────────── */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-container-padding-mobile md:px-container-padding-desktop pb-16 scroll-mt-28">
        <Reveal direction="roll">
          <h2 className="text-center font-display text-headline-lg-mobile md:text-headline-xl font-bold tracking-tight mb-12">
            How FitSense AI Works
          </h2>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {steps.map(({ n, title, desc }, i) => (
            <Reveal key={n} direction={i % 2 === 0 ? "left" : "right"} delay={i * 0.08}>
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: "#F5FF00", color: "#595800" }}
                >
                  {n}
                </div>
                <p className="font-semibold text-sm mb-1">{title}</p>
                <p className="text-xs opacity-70">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Final CTA (neon) ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-container-padding-mobile md:px-container-padding-desktop pb-12">
        <Reveal direction="scale">
          <div
            className="rounded-[28px] p-8 md:p-14 grid md:grid-cols-[0.7fr_1fr_1fr] gap-8 items-center overflow-hidden"
            style={{ backgroundColor: "#F5FF00" }}
          >
            <div className="hidden md:block relative h-52">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={CTA_MODEL}
                alt="Fashion model styled by FitSense AI"
                className="absolute inset-0 w-full h-full object-cover rounded-2xl"
              />
            </div>
            <h2 className="font-display text-headline-lg-mobile md:text-headline-xl font-bold tracking-tight" style={{ color: "#595800" }}>
              Your Style Has Never
              <br />
              Been This Intelligent.
            </h2>
            <div>
              <p className="mb-6" style={{ color: "#595800", opacity: 0.85 }}>
                Stop wondering what works. Start making fashion decisions
                with an AI that understands you.
              </p>
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-2xl font-semibold text-button"
                style={{ backgroundColor: "#595800", color: "#FFFDD7" }}
              >
                Start Your Style Journey →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: "#595800", color: "#FFFDD7" }}>
        <div className="max-w-7xl mx-auto px-container-padding-mobile md:px-container-padding-desktop py-12">
          <div className="grid md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="inline-block bg-[#FFFDD7] rounded-xl px-3 py-2 mb-3">
                <Image
                  src="/logo/fitsense-logo.png"
                  alt="FitSense AI"
                  width={130}
                  height={42}
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-xs opacity-70 mb-2">Your Personal AI Fashion Assistant.</p>
              <p className="text-xs opacity-70">Dress Smarter. Shop Smarter. Look Better.</p>
            </div>

            <div>
              <p className="text-xs font-semibold mb-3 opacity-90">Product</p>
              <ul className="space-y-2 text-xs opacity-70">
                <li><Link href="/auth" className="hover:opacity-100">AI Stylist</Link></li>
                <li><Link href="/auth" className="hover:opacity-100">Smart Wardrobe</Link></li>
                <li><Link href="/auth" className="hover:opacity-100">Outfit Generator</Link></li>
                <li><Link href="/auth" className="hover:opacity-100">Style Analysis</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold mb-3 opacity-90">Features</p>
              <ul className="space-y-2 text-xs opacity-70">
                <li><Link href="/auth" className="hover:opacity-100">Smart Shopping</Link></li>
                <li><Link href="/auth" className="hover:opacity-100">Travel Assistant</Link></li>
                <li><Link href="/auth" className="hover:opacity-100">Weekly Planner</Link></li>
                <li><Link href="/auth" className="hover:opacity-100">Fashion Analytics</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold mb-3 opacity-90">Company</p>
              <ul className="space-y-2 text-xs opacity-70">
                <li><Link href="#features" className="hover:opacity-100">About Us</Link></li>
                <li><Link href="#how-it-works" className="hover:opacity-100">How It Works</Link></li>
                <li><span className="opacity-60">Privacy Policy</span></li>
                <li><span className="opacity-60">Terms of Service</span></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold mb-3 opacity-90">Stay Updated</p>
              <p className="text-xs opacity-70 mb-3">Get fashion tips, AI updates and exclusive offers.</p>
              <div className="flex rounded-full overflow-hidden border border-[#FFFDD7]/25">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-transparent px-4 py-2 text-xs flex-1 outline-none placeholder:opacity-50"
                />
                <button
                  type="button"
                  className="px-4 flex items-center justify-center"
                  style={{ backgroundColor: "#F5FF00", color: "#595800" }}
                  aria-label="Subscribe"
                >
                  →
                </button>
              </div>
            </div>
          </div>
          <div className="border-t border-[#FFFDD7]/15 pt-6 text-xs opacity-60 text-center">
            © 2026 FitSense AI. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}