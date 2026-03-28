import { NextRequest } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function generateRefNumber(): string {
  return "INQ-" + Math.floor(10000 + Math.random() * 90000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, priority, tool_related, os_browser, message, screenshot_base64 } = body;

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return Response.json({ error: "Name, email, subject, and message are required." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (screenshot_base64 && screenshot_base64.length > 7 * 1024 * 1024) {
      return Response.json({ error: "Screenshot exceeds 5 MB limit." }, { status: 400 });
    }

    if (!db) {
      return Response.json({ error: "Support submissions are temporarily unavailable." }, { status: 503 });
    }

    // Generate unique reference number
    let refNumber = generateRefNumber();
    let attempts = 0;
    while (attempts < 5) {
      const existing = db.prepare("SELECT id FROM inquiries WHERE reference_number = ?").get(refNumber);
      if (!existing) break;
      refNumber = generateRefNumber();
      attempts++;
    }

    const id = crypto.randomUUID();
    const validPriorities = ["low", "medium", "high", "urgent"];

    db.prepare(`
      INSERT INTO inquiries
        (id, reference_number, name, email, subject, priority, tool_related, os_browser, message, screenshot_base64)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      refNumber,
      name.trim(),
      email.trim().toLowerCase(),
      subject.trim(),
      validPriorities.includes(priority) ? priority : "medium",
      tool_related?.trim() || null,
      os_browser?.trim() || null,
      message.trim(),
      screenshot_base64 || null,
    );

    // Save admin notification
    db.prepare(`
      INSERT INTO admin_notifications (id, type, message, reference_id)
      VALUES (?, 'new_inquiry', ?, ?)
    `).run(
      crypto.randomUUID(),
      `New inquiry from ${name.trim()} — ${subject.trim()} [${refNumber}]`,
      id,
    );

    return Response.json({ success: true, reference_number: refNumber }, { status: 201 });
  } catch (err) {
    console.error("Support inquiry error:", err);
    return Response.json({ error: "Failed to submit inquiry. Please try again." }, { status: 500 });
  }
}
