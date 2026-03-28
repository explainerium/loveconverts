import Link from "next/link";
import Logo from "./Logo";

const IMAGE_TOOLS = [
  { href: "/tools/compress",       label: "Compress Image" },
  { href: "/tools/resize",         label: "Resize Image"   },
  { href: "/tools/crop",           label: "Crop Image"     },
  { href: "/tools/convert-to-jpg", label: "Convert to JPG" },
  { href: "/tools/photo-editor",   label: "Photo Editor"   },
  { href: "/tools",                label: "All Tools →",   bold: true },
];

const DOWNLOADERS = [
  { href: "/downloaders/tiktok",    label: "TikTok"     },
  { href: "/downloaders/instagram", label: "Instagram"  },
  { href: "/downloaders/facebook",  label: "Facebook"   },
  { href: "/downloaders/youtube",   label: "YouTube"    },
  { href: "/downloaders/twitter",   label: "Twitter / X"},
  { href: "/downloaders",           label: "All Downloaders →", bold: true },
];

const COMPANY = [
  { href: "/about",        label: "About"           },
  { href: "/how-it-works", label: "How It Works"    },
  { href: "/faq",          label: "FAQ"             },
  { href: "/support",      label: "Support Center"  },
  { href: "/upgrade",      label: "Pricing"         },
  { href: "/terms",        label: "Terms of Service"},
  { href: "/privacy",      label: "Privacy Policy"  },
];

function FooterCol({ heading, links }: { heading: string; links: { href: string; label: string; bold?: boolean }[] }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-[#475569] mb-3.5">
        {heading}
      </p>
      <ul className="space-y-2.5">
        {links.map(({ href, label, bold }) => (
          <li key={href}>
            <Link
              href={href}
              className={`text-[13px] hover:text-[#FF8C42] transition-colors ${
                bold ? "text-[#FF8C42] font-semibold" : "text-[#94A3B8]"
              }`}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#1A1A2E] text-[#CBD5E1]">
      {/* Gradient top border */}
      <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #FF4747 0%, #FF8C42 100%)" }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          {/* Brand column */}
          <div className="space-y-4">
            <Logo size="sm" />
            <p className="text-[#94A3B8] text-[13px] leading-[1.7]">
              Free image conversion and media downloading at{" "}
              <a
                href="https://loveconvertimg.com"
                className="text-[#FF8C42] hover:underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                loveconvertimg.com
              </a>
              . No signup required. Your files stay private — never stored on our servers.
            </p>
            {/* Social icons */}
            <div className="flex gap-3 pt-1">
              <a href="#" aria-label="Twitter" className="text-[#64748B] hover:text-[#FF8C42] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.2 3H21l-7.2 8.3L22.5 21H16l-4.8-6.3L5.3 21H2.5l7.7-8.8L2 3h6.7l4.4 5.8L18.2 3zm-1 16.2h1.7L7 4.8H5.2L17.2 19.2z"/>
                </svg>
              </a>
              <a href="#" aria-label="GitHub" className="text-[#64748B] hover:text-[#FF8C42] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.10-.25-.45-1.27.10-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.71.11 2.51.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.20 2.4.10 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10z"/>
                </svg>
              </a>
            </div>
          </div>

          <FooterCol heading="Image Tools" links={IMAGE_TOOLS} />
          <FooterCol heading="Downloaders" links={DOWNLOADERS} />
          <FooterCol heading="Company" links={COMPANY} />
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[12px] text-[#475569]">
            &copy; {new Date().getFullYear()} LoveConverts &middot; loveconvertimg.com &middot; All rights reserved
          </p>

          {/* Explainerium credit */}
          <a
            href="https://explainerium.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-center group"
          >
            <p className="text-[11px] text-[#475569] mb-0.5">
              Designed &amp; Managed By
            </p>
            <span
              className="text-[14px] font-bold tracking-[3px] uppercase group-hover:opacity-80 transition-opacity"
              style={{
                background: "linear-gradient(90deg, #FF4747, #FF8C42)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Explainerium.co
            </span>
          </a>

          <p className="text-[12px] text-[#475569]">
            Files processed in memory &middot; Never stored
          </p>
        </div>
      </div>
    </footer>
  );
}
