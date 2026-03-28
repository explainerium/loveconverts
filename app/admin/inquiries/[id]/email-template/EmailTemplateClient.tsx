"use client";

import { useState } from "react";
import { Copy, CheckCircle2 } from "lucide-react";

interface Inquiry {
  reference_number: string;
  name: string;
  email: string;
  subject: string;
  status: string;
  message: string;
  admin_notes: string | null;
}

export default function EmailTemplateClient({
  inquiry,
  agentName,
}: {
  inquiry: Inquiry;
  agentName: string;
}) {
  const [reply,  setReply]  = useState("");
  const [copied, setCopied] = useState(false);

  const emailText = `To: ${inquiry.email}
Subject: Re: [${inquiry.reference_number}] ${inquiry.subject}

Hi ${inquiry.name},

Thank you for reaching out to LoveConverts Support.

We're writing in response to your inquiry (Ref: ${inquiry.reference_number}) regarding:
"${inquiry.subject}"

${reply || "[Your reply goes here…]"}

If you have any further questions, please don't hesitate to reply to this email or submit a new inquiry at https://loveconverts.com/support.

Best regards,
${agentName}
LoveConverts Support Team
https://loveconverts.com

---
This is a response to inquiry ${inquiry.reference_number}.
Current status: ${inquiry.status.replace("_", " ").toUpperCase()}
`;

  function copyToClipboard() {
    navigator.clipboard.writeText(emailText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-5">
      {/* Reply input */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-3">
        <label className="text-sm font-semibold text-foreground">Your Reply Body</label>
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={6}
          placeholder="Type your reply here — it will appear in the email preview below…"
          className="w-full px-3.5 py-2.5 text-sm border border-border rounded-xl bg-background focus:outline-none focus:border-primary resize-y"
        />
      </div>

      {/* Email preview */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b border-border px-5 py-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Email Preview</p>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-border text-muted hover:text-foreground hover:border-primary transition-colors"
          >
            {copied ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
        </div>
        <pre className="px-5 py-5 text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
          {emailText}
        </pre>
      </div>

      {/* Original message */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-2">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">Original Message</p>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{inquiry.message}</p>
        {inquiry.admin_notes && (
          <>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider pt-3">Admin Notes</p>
            <p className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{inquiry.admin_notes}</p>
          </>
        )}
      </div>
    </div>
  );
}
