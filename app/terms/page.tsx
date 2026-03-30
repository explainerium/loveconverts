import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LoveConverts Terms of Service. Read our acceptable use policy for image tools and media downloaders.",
  alternates: { canonical: "https://loveconverts.com/terms" },
};

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using LoveConverts ("Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.`,
  },
  {
    title: "2. Description of Service",
    body: `LoveConverts provides free online image conversion, compression, resizing, cropping, and editing tools. The Service is provided "as is" and may change at any time.`,
  },
  {
    title: "3. Your Files and Privacy",
    body: `Images you upload are processed in memory on our servers and are never stored to disk. We do not retain, analyse, or share your files. All processing happens server-side; files are discarded immediately after conversion.`,
  },
  {
    title: "4. Acceptable Use",
    body: `You agree not to upload illegal content, malware, or material that infringes third-party intellectual property rights. You are responsible for ensuring you have the right to convert any file you upload.`,
  },
  {
    title: "5. Free and Pro Tiers",
    body: `The free tier allows up to 20 conversions per day and a maximum file size of 20 MB. Pro subscribers receive unlimited conversions and a 50 MB file limit. Abuse of the free tier may result in temporary rate limiting.`,
  },
  {
    title: "6. Accounts",
    body: `You may create an account to access additional features. You are responsible for maintaining the security of your account credentials. We reserve the right to suspend accounts that violate these terms.`,
  },
  {
    title: "7. Intellectual Property",
    body: `LoveConverts and its logos, design, and software are the property of their respective owners. You retain full ownership of the images you convert.`,
  },
  {
    title: "8. Disclaimer of Warranties",
    body: `The Service is provided without warranties of any kind. We do not guarantee uninterrupted availability or error-free processing. Image conversion is lossy in some cases. Please keep originals.`,
  },
  {
    title: "9. Limitation of Liability",
    body: `To the maximum extent permitted by law, LoveConverts shall not be liable for any indirect, incidental, or consequential damages arising from use of the Service.`,
  },
  {
    title: "10. Changes to Terms",
    body: `We may update these terms from time to time. Continued use of the Service after changes constitutes acceptance of the new terms.`,
  },
  {
    title: "11. Contact",
    body: `Questions about these terms? Contact us via the feedback form on our website.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-3xl font-extrabold text-foreground">Terms of Service</h1>
          <p className="text-muted mt-2 text-sm">Last updated: March 26, 2026</p>
        </div>

        <div className="space-y-6">
          {SECTIONS.map(({ title, body }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-5">
              <h2 className="text-sm font-bold text-foreground mb-2">{title}</h2>
              <p className="text-sm text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-xs text-muted">
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          {" · "}
          <Link href="/" className="text-primary hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
