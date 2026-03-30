import type { Metadata } from "next";
import Link from "next/link";
import { ImageIcon, Code2, Server, Zap, Shield, Heart } from "lucide-react";
import DonateButton from "./DonateButton";

export const metadata: Metadata = {
  title: "About LoveConverts: Free Image and Media Tools",
  description:
    "LoveConverts is a free image conversion and media downloading platform built by Explainerium. No signup, no file storage, always free.",
  alternates: { canonical: "https://loveconverts.com/about" },
};

const STACK = [
  {
    icon: Code2,
    name: "Next.js 15",
    desc: "React framework for server-side rendering and API routes",
    color: "text-foreground",
    bg: "bg-gray-100",
  },
  {
    icon: Server,
    name: "Sharp",
    desc: "High-performance Node.js image processing powered by libvips",
    color: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: Code2,
    name: "TypeScript",
    desc: "Fully typed codebase for reliability and maintainability",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Zap,
    name: "Tailwind CSS v4",
    desc: "Utility-first CSS framework for rapid, responsive UI development",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
  },
];

const VALUES = [
  {
    icon: Zap,
    title: "Fast",
    desc: "Processing happens on our server using Sharp, so conversions are fast regardless of your device.",
  },
  {
    icon: Shield,
    title: "Private",
    desc: "Your images are processed in memory and deleted straight after. We never write anything to disk.",
  },
  {
    icon: Heart,
    title: "Free forever",
    desc: "The core tools are free and will stay free. No ads, no tracking, no tricks.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-12 text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <ImageIcon size={30} className="text-white" />
          </div>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-foreground">
          About LoveConverts
        </h1>
        <p className="text-muted text-lg leading-relaxed max-w-2xl mx-auto">
          LoveConverts is a free image converter that runs on our server. No
          account needed, no files stored. Upload your image, pick a format,
          download the result.
        </p>
      </section>

      {/* Mission */}
      <section className="bg-card border-y border-border py-14 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-extrabold text-foreground mb-5">Our Mission</h2>
          <p className="text-muted leading-relaxed mb-4">
            Most image converters ask you to sign up, show you ads, or keep
            your files on their servers. We built LoveConverts because we wanted
            something that just works without any of that.
          </p>
          <p className="text-muted leading-relaxed mb-4">
            We support 7 output formats (JPG, PNG, WEBP, AVIF, GIF, TIFF, ICO)
            with full control over quality, resize, rotation, grayscale, and
            more, all processed using Sharp, one of the fastest image
            processing libraries available.
          </p>
          <p className="text-muted leading-relaxed">
            Every image you upload is processed in memory on our server and
            discarded immediately after the response is sent. We use Google
            Analytics to understand how the site is being used. No images or
            personal files are tracked.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14">
        <h2 className="text-2xl font-extrabold text-foreground mb-8 text-center">What we stand for</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {VALUES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                <Icon size={20} className="text-primary" />
              </div>
              <h3 className="font-bold text-foreground">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="bg-card border-y border-border py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-extrabold text-foreground mb-8 text-center">Tech Stack</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STACK.map(({ icon: Icon, name, desc, color, bg }) => (
              <div key={name} className="flex items-start gap-4 p-5 rounded-2xl border border-border hover:border-primary/30 hover:shadow-sm transition-all bg-background">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                  <Icon size={20} className={color} />
                </div>
                <div>
                  <p className="font-bold text-foreground">{name}</p>
                  <p className="text-sm text-muted leading-snug mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center space-y-5">
        <h2 className="text-2xl font-extrabold text-foreground">Support the project</h2>
        <p className="text-muted leading-relaxed">
          LoveConverts is free and that is not changing. If you find it useful,
          share it with someone who needs it. That is the best way to support
          the project.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <DonateButton />
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-semibold border border-border text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ImageIcon size={17} />
            Start Converting
          </Link>
        </div>
      </section>
    </div>
  );
}
