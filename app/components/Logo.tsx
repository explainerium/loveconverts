import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { box: 32, font: 18, sub: 11 },
    md: { box: 42, font: 24, sub: 14 },
    lg: { box: 56, font: 32, sub: 18 },
  };
  const s = sizes[size];
  return (
    <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={s.box} height={s.box} viewBox="0 0 80 80" fill="none">
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FF4747" />
            <stop offset="100%" stopColor="#FF8C42" />
          </linearGradient>
        </defs>
        <rect width="80" height="80" rx="18" fill="url(#lg1)" />
        <path
          d="M40 60 C40 60 14 43 14 27 C14 17 22 10 31 13 C35 14 38 18 40 22 C42 18 45 14 49 13 C58 10 66 17 66 27 C66 43 40 60 40 60Z"
          fill="white"
        />
        <path
          d="M27 32 Q40 20 53 32"
          fill="none"
          stroke="url(#lg1)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M49 27 L53 32 L48 35"
          fill="none"
          stroke="url(#lg1)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{ lineHeight: 1.1 }}>
        <div
          style={{
            fontSize: s.font,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            letterSpacing: "-0.5px",
          }}
        >
          <span
            style={{
              background: "linear-gradient(90deg, #FF4747, #FF8C42)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            love
          </span>
          <span style={{ color: "#1A1A2E" }}>converts</span>
        </div>
        {size !== "sm" && (
          <div
            style={{
              fontSize: 10,
              color: "#94A3B8",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            Free Image Conversion
          </div>
        )}
      </div>
    </Link>
  );
}
