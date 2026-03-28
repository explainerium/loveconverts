import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime  = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (!db) {
      return Response.json({ error: "Registration is not available in this deployment." }, { status: 503 });
    }

    const existing = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(email.toLowerCase().trim());

    if (existing) {
      return Response.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = crypto.randomUUID();

    db.prepare(`
      INSERT INTO users (id, email, name, password_hash, plan)
      VALUES (?, ?, ?, ?, 'free')
    `).run(id, email.toLowerCase().trim(), name?.trim() || null, passwordHash);

    return Response.json({ success: true, id }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return Response.json({ error: "Registration failed" }, { status: 500 });
  }
}
