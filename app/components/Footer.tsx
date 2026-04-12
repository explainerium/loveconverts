import Link from "next/link";
import Logo from "./Logo";

const IMAGE_TOOLS = [
  { href: "/tools/compress",           label: "Compress Image" },
  { href: "/tools/compress-video",     label: "Compress Video" },
  { href: "/tools/resize",             label: "Resize Image"   },
  { href: "/tools/crop",               label: "Crop Image"     },
  { href: "/tools/convert-to-jpg",     label: "Convert to JPG" },
  { href: "/tools/photo-editor",       label: "Photo Editor"   },
  { href: "/tools/remove-background",  label: "Remove Background" },
  { href: "/tools/upscale",            label: "Upscale Image"  },
  { href: "/tools/image-to-pdf",       label: "Image to PDF"   },
  { href: "/tools/pdf-to-image",       label: "PDF to Image"   },
  { href: "/tools/batch-convert",      label: "Batch Convert"  },
  { href: "/tools/heic-to-jpg",        label: "HEIC to JPG"    },
  { href: "/convert",                  label: "All Conversions →", bold: true },
  { href: "/tools",                    label: "All Tools →",   bold: true },
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
  { href: "/blog",         label: "Blog"            },
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
              Free image conversion and video downloading. No signup required. Your files are processed in memory and never stored.
            </p>
            {/* Social */}
            <div className="flex gap-3 pt-1">
              <a href="https://web.facebook.com/mohammadnajir02/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-[#64748B] hover:text-[#FF8C42] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
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
            &copy; {new Date().getFullYear()} LoveConverts &middot; loveconverts.com &middot; All rights reserved
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
