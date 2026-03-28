"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Zap, CheckCircle2, X as XIcon, Crown, Shield, Rocket,
  ImageIcon, Download, HardDrive, Clock, Layers, Wand2,
  ArrowRight, Star, Sparkles, ChevronDown, LayoutDashboard,
} from "lucide-react";

const FREE_FEATURES = [
  { label: "20 conversions per day",     included: true  },
  { label: "10 MB max file size",        included: true  },
  { label: "All image tools",            included: true  },
  { label: "All downloaders",            included: true  },
  { label: "No sign-up required",        included: true  },
  { label: "Batch processing (5 files)", included: true  },
  { label: "Priority processing",        included: false },
  { label: "50 MB file uploads",         included: false },
  { label: "Unlimited conversions",      included: false },
  { label: "Batch up to 50 files",       included: false },
  { label: "Advanced AI tools",          included: false },
  { label: "No ads",                     included: false },
];

const PRO_FEATURES = [
  { label: "Unlimited conversions",      included: true  },
  { label: "50 MB max file size",        included: true  },
  { label: "All image tools",            included: true  },
  { label: "All downloaders",            included: true  },
  { label: "Priority processing speed",  included: true  },
  { label: "Batch processing (50 files)",included: true  },
  { label: "Advanced AI tools",          included: true  },
  { label: "No ads anywhere",            included: true  },
  { label: "Early access to new tools",  included: true  },
  { label: "Priority email support",     included: true  },
  { label: "Conversion history (cloud)", included: true  },
  { label: "Custom output presets",      included: true  },
];

const HIGHLIGHTS = [
  { icon: Rocket,    label: "Lightning Fast",   desc: "Priority queue means your files process 3x faster than free tier." },
  { icon: HardDrive, label: "Bigger Files",     desc: "Upload images up to 50 MB. Perfect for RAW and high-res photos." },
  { icon: Layers,    label: "Batch Power",      desc: "Convert up to 50 files at once. Save hours of repetitive work." },
  { icon: Wand2,     label: "AI Tools",         desc: "Access background removal, upscaling, and smart enhancement." },
  { icon: Shield,    label: "Ad-Free",          desc: "Clean, distraction-free interface. No banners, no pop-ups." },
  { icon: Clock,     label: "Early Access",     desc: "Be the first to try new tools before they launch publicly." },
];

const FAQ = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from your dashboard at any time. You keep Pro access until the end of your billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards (Visa, Mastercard, Amex) and PayPal via Stripe.",
  },
  {
    q: "Is there a refund policy?",
    a: "Yes — we offer a full refund within 7 days of purchase if you're not satisfied, no questions asked.",
  },
  {
    q: "Do I need an account for the free tier?",
    a: "No! The free tier works without any sign-up. Create an account only if you want conversion history and higher limits.",
  },
  {
    q: "What happens when I hit the free limit?",
    a: "You'll see a friendly prompt to upgrade. Your conversions won't be lost — just wait until the next day or upgrade for instant access.",
  },
];

export default function UpgradePage() {
  const { data: session } = useSession();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isPro = session?.user?.plan === "pro";

  const monthlyPrice = 4.99;
  const yearlyPrice  = 39.99;
  const yearlyMonthly = (yearlyPrice / 12).toFixed(2);
  const savingsPercent = Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        {/* Background blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #FF4747, transparent 70%)" }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, #FF8C42, transparent 70%)" }} />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 text-xs font-bold px-4 py-1.5 rounded-full border border-amber-200 mb-6">
            <Crown size={13} /> UPGRADE TO PRO
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground leading-tight">
            Supercharge your
            <span className="block mt-1" style={{
              background: "linear-gradient(135deg, #FF4747, #FF8C42)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              image workflow
            </span>
          </h1>
          <p className="text-lg text-muted mt-4 max-w-xl mx-auto">
            Unlimited conversions, bigger files, batch processing, AI tools, and zero ads. One simple plan.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-5xl mx-auto px-4 -mt-4 pb-20">
        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-sm font-semibold ${billing === "monthly" ? "text-foreground" : "text-muted"}`}>Monthly</span>
          <button
            onClick={() => setBilling(b => b === "monthly" ? "yearly" : "monthly")}
            className="relative w-14 h-7 rounded-full transition-colors duration-300"
            style={{ background: billing === "yearly" ? "linear-gradient(135deg, #FF4747, #FF8C42)" : "#E2E8F0" }}
          >
            <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${
              billing === "yearly" ? "left-[30px]" : "left-0.5"
            }`} />
          </button>
          <span className={`text-sm font-semibold ${billing === "yearly" ? "text-foreground" : "text-muted"}`}>
            Yearly
            <span className="ml-1.5 text-[11px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
              Save {savingsPercent}%
            </span>
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-card border border-border rounded-2xl p-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon size={20} className="text-muted" />
                <h2 className="text-xl font-extrabold text-foreground">Free</h2>
              </div>
              <p className="text-sm text-muted">Everything you need to get started</p>
            </div>

            <div>
              <span className="text-4xl font-extrabold text-foreground">$0</span>
              <span className="text-muted text-sm ml-1">/ forever</span>
            </div>

            <Link
              href="/"
              className="block w-full text-center py-3 rounded-xl text-sm font-bold border border-border text-foreground hover:bg-gray-50 transition-all duration-200"
            >
              Get Started Free
            </Link>

            <div className="space-y-3">
              {FREE_FEATURES.map(({ label, included }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm">
                  {included ? (
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <XIcon size={16} className="text-gray-300 flex-shrink-0" />
                  )}
                  <span className={included ? "text-foreground" : "text-muted line-through"}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-card rounded-2xl p-7 space-y-6 border-2 border-primary shadow-xl">
            {/* Popular badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #FF4747, #FF8C42)" }}>
                <Star size={11} /> MOST POPULAR
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF4747, #FF8C42)" }}>
                  <Zap size={15} className="text-white" />
                </div>
                <h2 className="text-xl font-extrabold text-foreground">Pro</h2>
              </div>
              <p className="text-sm text-muted">For power users and professionals</p>
            </div>

            <div>
              <span className="text-4xl font-extrabold text-foreground">
                ${billing === "yearly" ? yearlyMonthly : monthlyPrice.toFixed(2)}
              </span>
              <span className="text-muted text-sm ml-1">/ month</span>
              {billing === "yearly" && (
                <p className="text-xs text-muted mt-1">
                  Billed annually at <strong className="text-foreground">${yearlyPrice}/year</strong>
                </p>
              )}
            </div>

            {isPro ? (
              <div className="w-full text-center py-3 rounded-xl text-sm font-bold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 size={15} className="inline mr-1.5" />
                You&apos;re on Pro!
              </div>
            ) : (
              <button
                className="block w-full text-center py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #FF4747, #FF8C42)" }}
              >
                Upgrade Now <ArrowRight size={14} className="inline ml-1" />
              </button>
            )}

            <div className="space-y-3">
              {PRO_FEATURES.map(({ label, included }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm">
                  {included ? (
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <XIcon size={16} className="text-gray-300 flex-shrink-0" />
                  )}
                  <span className={included ? "text-foreground" : "text-muted line-through"}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Secure payment via Stripe. Cancel anytime. 7-day money-back guarantee.
        </p>
      </section>

      {/* Highlights grid */}
      <section className="bg-[#F1F5F9] py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-primary text-xs font-bold px-3 py-1 rounded-full bg-primary-light mb-3">
              <Sparkles size={12} /> WHY UPGRADE
            </div>
            <h2 className="text-3xl font-extrabold text-foreground">Everything Pro gives you</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HIGHLIGHTS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, rgba(255,71,71,0.1), rgba(255,140,66,0.1))" }}>
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{label}</h3>
                <p className="text-sm text-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-foreground text-center mb-8">Detailed Comparison</h2>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#F8FAFC]">
                <th className="text-left px-5 py-3 font-semibold text-muted">Feature</th>
                <th className="text-center px-4 py-3 font-semibold text-muted w-28">Free</th>
                <th className="text-center px-4 py-3 font-bold text-primary w-28">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Daily conversions",        "20",          "Unlimited"],
                ["Max file size",            "10 MB",       "50 MB"],
                ["Batch processing",         "5 files",     "50 files"],
                ["Image tools",              "All 5",       "All 5 + AI"],
                ["Downloaders",              "All",         "All"],
                ["Processing speed",         "Standard",    "Priority"],
                ["Ads",                      "Minimal",     "None"],
                ["Cloud history",            "—",           "Included"],
                ["Custom presets",           "—",           "Included"],
                ["Email support",            "Standard",    "Priority"],
                ["Early access",             "—",           "Included"],
              ].map(([feature, free, pro], i) => (
                <tr key={feature} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"}>
                  <td className="px-5 py-3 text-foreground font-medium">{feature}</td>
                  <td className="text-center px-4 py-3 text-muted">{free}</td>
                  <td className="text-center px-4 py-3 text-foreground font-semibold">{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-extrabold text-foreground text-center mb-8">Pricing FAQ</h2>
        <div className="space-y-3">
          {FAQ.map(({ q, a }, i) => (
            <div key={q} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-foreground">{q}</span>
                <ChevronDown size={16} className={`text-muted flex-shrink-0 ml-3 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 pb-4" : "max-h-0"}`}>
                <p className="text-sm text-muted px-5 leading-relaxed">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%)" }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold text-white mb-3">Ready to go Pro?</h2>
          <p className="text-[#94A3B8] mb-8">
            Join thousands of creators who convert smarter with LoveConverts Pro.
          </p>
          {isPro ? (
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white border-2 border-white/20 hover:border-white/40 transition-colors">
              <LayoutDashboard size={16} /> Go to Dashboard
            </Link>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                className="px-8 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #FF4747, #FF8C42)" }}
              >
                Upgrade Now — ${billing === "yearly" ? `${yearlyPrice}/yr` : `${monthlyPrice}/mo`}
              </button>
              <Link href="/" className="px-6 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white transition-colors">
                Try free first &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
