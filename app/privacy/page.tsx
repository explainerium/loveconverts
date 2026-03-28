import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "LoveConverts Privacy Policy — how we handle your data and images.",
};

const SECTIONS = [
  {
    title: "1. Overview",
    body: `LoveConverts is designed with privacy in mind. We process your images server-side but do not store them. This policy explains what data we collect and how we use it.`,
  },
  {
    title: "2. Images You Upload",
    body: `Images uploaded for conversion are processed entirely in memory. They are never written to disk, never stored in a database, and are discarded immediately after your converted file is returned. We do not view, analyse, or share your images.`,
  },
  {
    title: "3. Account Data",
    body: `If you create an account, we store your name, email address, hashed password (bcrypt), and usage statistics (conversion count, date) in a locally hosted SQLite database. We do not sell this information to third parties.`,
  },
  {
    title: "4. Conversion History",
    body: `Logged-in users may see their conversion history (filename, format, size, date). This metadata is stored server-side and is only accessible to you. You can delete all history from your dashboard at any time.`,
  },
  {
    title: "5. OAuth Sign-In",
    body: `If you sign in with Google, we receive your name, email, and profile picture URL from Google. We store only your name and email. We do not receive your Google password.`,
  },
  {
    title: "6. Cookies and Sessions",
    body: `We use a secure, HTTP-only JWT session cookie for authentication. This cookie expires after 30 days. We do not use third-party tracking cookies or analytics SDKs.`,
  },
  {
    title: "7. Local Storage",
    body: `The main converter page optionally stores your recent conversion history in your browser's localStorage. This data never leaves your device unless you are signed in.`,
  },
  {
    title: "8. Server Logs",
    body: `Our web server may log standard HTTP request information (IP address, timestamp, URL, response code) for debugging and abuse prevention. These logs are retained for a maximum of 30 days.`,
  },
  {
    title: "9. Data Retention",
    body: `Account data is retained until you delete your account. Conversion metadata is retained until you clear your history. Server logs are automatically purged after 30 days.`,
  },
  {
    title: "10. Your Rights",
    body: `You can delete your account and all associated data from the Account Settings page in your dashboard. If you have questions or requests regarding your data, contact us via the website.`,
  },
  {
    title: "11. Changes to This Policy",
    body: `We may update this policy as the Service evolves. We will note the date of the last update above. Continued use of the Service constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Legal</p>
          <h1 className="text-3xl font-extrabold text-foreground">Privacy Policy</h1>
          <p className="text-muted mt-2 text-sm">Last updated: March 26, 2026</p>
        </div>

        <div className="bg-primary-light border border-primary/20 rounded-2xl px-5 py-4 mb-6">
          <p className="text-sm text-primary font-semibold">
            TL;DR: We never store your images. We only store your account info if you sign up. We don&apos;t sell data.
          </p>
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
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {" · "}
          <Link href="/" className="text-primary hover:underline">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
